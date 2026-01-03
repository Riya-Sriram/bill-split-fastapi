import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import toast from 'react-hot-toast';
import { api } from '../services/api';

Chart.register(ArcElement, Tooltip, Legend);

function Charts({result, myName, expenses, groupId}){
  const [memberChart,setMemberChart]=useState(null);
  const [categoryChart,setCategoryChart]=useState(null);
  const [owedAmounts, setOwedAmounts] = useState([]);
  
  function capitalize(word){
    if (!word) return '';
    return word.charAt(0).toUpperCase()+word.slice(1);
  }
  
  function CategoryTotals(expenses) {
    const totals = {};
    if (!expenses || expenses.length === 0) return totals;
    expenses.forEach(exp => {
      const cat = exp.category || 'Uncategorized';
      const cost = exp.cost || 0;
      if (!totals[cat]) totals[cat] = 0;
      totals[cat] += cost;
    });
    return totals;
  }

  // Fetch settlements from backend
  const fetchSettlements = async () => {
    if (!groupId) return;
    try {
      const data = await api.expense.getSettlements(groupId);
      setOwedAmounts(data || []);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setOwedAmounts([]);
    }
  };

  function calculateMemberTotals() {
    const totals = {};
    if (!result?.members) return {};
    
    result.members.forEach(member => {
      totals[member.username] = 0;
    });
    
    if (expenses && expenses.length > 0) {
      expenses.forEach(exp => {
        if (exp.paidBy && totals[exp.paidBy] !== undefined) {
          totals[exp.paidBy] += (exp.cost || 0);
        }
      });
    }
    
    return totals;
  }

  useEffect(() => {
    fetchSettlements();
  }, [groupId, expenses]);

  useEffect(() => {
    if (!result||!result.members||!expenses)return;
    
    const memberTotals = calculateMemberTotals();
    const memberLabels=result.members.map(member=>
      member.username===myName?'You':capitalize(member.username)
    );
    const memberAmounts = result.members.map(member=>memberTotals[member.username] || 0);
    
    setMemberChart({
      labels: memberLabels,
      datasets:[
        {
          label:'Amount Spent',
          data:memberAmounts,
          backgroundColor: [
            '#60a5fa', '#f87171', '#fbbf24',
            '#34d399', '#a78bfa', '#fb7185', '#22d3ee'
          ],
          borderWidth:1,
        },
      ],
    });
    
    const totals=CategoryTotals(expenses);
    const catLabels=Object.keys(totals);
    const catData=Object.values(totals);

    setCategoryChart({
      labels: catLabels,
      datasets: [
        {
          label: '₹ Spent',
          data: catData,
          backgroundColor: [
            '#f87171', '#60a5fa', '#34d399',
            '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee'
          ],
          borderWidth: 1,
        },
      ],
    });
  }, [result, myName, expenses]);
  
  const handlePaid = async (person) => {
    if (!groupId) return;
    try {
      const data = await api.expense.settleDebt(person, groupId);
      if (data.success) {
        toast.success(`Marked payment to ${capitalize(person)} as paid!`);
        // Refetch settlements after settling
        await fetchSettlements();
      } else {
        toast.error('Failed to mark as paid');
      }
    } catch (error) {
      console.error('Error settling debt:', error);
      toast.error('Error settling debt');
    }
  };
  
  if (!memberChart || !categoryChart) return <div className="p-4 text-black">Loading charts...</div>;
  
  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-black">
        <h2 className="text-xl font-bold mb-4 text-center text-black underline underline-offset-4">Member Amounts</h2>
        <Doughnut data={memberChart} />
      </div>
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-black">
        <h2 className="text-xl font-bold mb-4 text-center text-black underline underline-offset-4">Spending by Category</h2>
        <Doughnut data={categoryChart} />
      </div>
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-black">
        <h2 className="text-xl font-bold mb-4 text-center text-black underline underline-offset-4">What You Owe</h2>
        <div className="space-y-3">
          {owedAmounts.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No pending payments!!!</p>
          ) : (
            owedAmounts.map((debt) => (
              <div key={debt.person} className="flex flex-col p-3 bg-slate-50 rounded-lg border border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-black">{capitalize(debt.person)}</span>
                  <span className="text-red-600 font-bold">₹{debt.amount}</span>
                </div>
                <button
                  onClick={() => handlePaid(debt.person)}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                >
                  Mark as Paid
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Charts;
