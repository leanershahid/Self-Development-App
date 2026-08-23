import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Award, Star, Sparkles, Medal, Crown, Zap, Trash2, X, Check, FileImage } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './NavBar';

const supabaseUrl = 'https://quufeiwzsgiuwkeyjjns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dWZlaXd6c2dpdXdrZXlqam5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5OTYsImV4cCI6MjA4MzQ2MDk5Nn0.KL0XNEg4o4RVMJOfAQdWQekug_sw2I0KNTLkj_73_sg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RewardsDashboard() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newReward, setNewReward] = useState({
    reward_type: 'weekly',
    week_count: '',
    reward_title: '',
    reward_description: '',
    image_url: ''
  });

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const { data: rewardsList } = await supabase
        .from('rewards')
        .select('*')
        .order('reward_type', { ascending: true })
        .order('week_count', { ascending: true });

      setRewards(rewardsList || []);
    } catch (error) {
      console.error("Error loading rewards:", error);
    }
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const url = e.target.value;
    setNewReward({ ...newReward, image_url: url });
    setImagePreview(url);
  };

  const addReward = async () => {
    if (!newReward.reward_title.trim()) {
      alert('Please enter a reward title');
      return;
    }

    if (newReward.reward_type === 'weekly' && !newReward.week_count) {
      alert('Please enter week count for weekly rewards');
      return;
    }

    try {
      const rewardData = {
        reward_type: newReward.reward_type,
        reward_title: newReward.reward_title.trim(),
        reward_description: newReward.reward_description.trim() || null,
        image_url: newReward.image_url.trim() || null
      };

      if (newReward.reward_type === 'weekly') {
        rewardData.week_count = parseInt(newReward.week_count);
      }

      const { data, error } = await supabase
        .from('rewards')
        .insert([rewardData])
        .select()
        .single();

      if (error) throw error;

      await loadRewards();
      setNewReward({
        reward_type: 'weekly',
        week_count: '',
        reward_title: '',
        reward_description: '',
        image_url: ''
      });
      setImagePreview(null);
      setShowRewardForm(false);
      alert('Reward added successfully!');
    } catch (error) {
      console.error("Error adding reward:", error);
      alert('Failed to add reward: ' + error.message);
    }
  };

  const deleteReward = async (rewardId) => {
    if (!confirm('Are you sure you want to delete this reward?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;

      await loadRewards();
      alert('Reward deleted successfully!');
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert('Failed to delete reward: ' + error.message);
    }
  };

  const addDefaultWeeklyRewards = async () => {
    const defaultRewards = [
      //   { 
      //     reward_type: 'weekly', 
      //     week_count: 1, 
      //     reward_title: 'Bronze Focus Badge', 
      //     reward_description: 'Completed your first focused week',
      //     image_url: 'https://images.unsplash.com/photo-1618344606923-f3ded1e29a1a?w=400&h=400&fit=crop'
      //   },
      //   { 
      //     reward_type: 'weekly', 
      //     week_count: 2, 
      //     reward_title: 'Silver Discipline Badge', 
      //     reward_description: 'Two weeks of consistent productivity',
      //     image_url: 'https://images.unsplash.com/photo-1618344606904-2d91e6f6ec00?w=400&h=400&fit=crop'
      //   },
      //   { 
      //     reward_type: 'weekly', 
      //     week_count: 3, 
      //     reward_title: 'Gold Consistency Badge', 
      //     reward_description: 'Three weeks without breaking the flow',
      //     image_url: 'https://images.unsplash.com/photo-1618344604068-09d7b84b815e?w=400&h=400&fit=crop'
      //   },
      //   { 
      //     reward_type: 'weekly', 
      //     week_count: 4, 
      //     reward_title: 'Platinum Performer Badge', 
      //     reward_description: 'One full month of strong discipline',
      //     image_url: 'https://images.unsplash.com/photo-1618344606904-2d91e6f6ec00?w=400&h=400&fit=crop'
      //   },
      //   { 
      //     reward_type: 'weekly', 
      //     week_count: 8, 
      //     reward_title: 'Diamond Master Badge', 
      //     reward_description: 'Two months of unstoppable focus',
      //     image_url: 'https://images.unsplash.com/photo-1618344606923-f3ded1e29a1a?w=400&h=400&fit=crop'
      //   }
    ];

    try {
      const { data, error } = await supabase
        .from('rewards')
        .insert(defaultRewards)
        .select();

      if (error) throw error;

      await loadRewards();
      alert('Default weekly rewards added successfully!');
    } catch (error) {
      console.error("Error adding default rewards:", error);
      alert('Failed to add default rewards: ' + error.message);
    }
  };

  const getRewardIcon = (weekCount) => {
    if (!weekCount) return <Gift size={28} strokeWidth={2.5} />;
    if (weekCount === 1) return <Medal size={28} strokeWidth={2.5} />;
    if (weekCount === 2) return <Star size={28} strokeWidth={2.5} />;
    if (weekCount === 3) return <Award size={28} strokeWidth={2.5} />;
    if (weekCount === 4) return <Trophy size={28} strokeWidth={2.5} />;
    if (weekCount >= 8) return <Crown size={28} strokeWidth={2.5} />;
    return <Sparkles size={28} strokeWidth={2.5} />;
  };

  const getRewardGradient = (weekCount, unlocked) => {
    if (!unlocked) return 'from-slate-700 to-slate-800 text-slate-500';
    if (!weekCount) return 'from-sky-400 to-blue-600 text-white';
    if (weekCount === 1) return 'from-amber-400 to-amber-600 text-white';
    if (weekCount === 2) return 'from-slate-300 to-slate-500 text-white';
    if (weekCount === 3) return 'from-yellow-300 to-amber-500 text-white';
    if (weekCount === 4) return 'from-cyan-300 to-sky-500 text-white';
    if (weekCount >= 8) return 'from-violet-400 to-fuchsia-600 text-white';
    return 'from-emerald-400 to-teal-500 text-white';
  };

  const getRewardBorderGlow = (weekCount, unlocked) => {
    if (!unlocked) return 'border-white/5 hover:border-white/10 shadow-none';
    if (!weekCount) return 'border-sky-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] shadow-[0_0_10px_rgba(14,165,233,0.1)]';
    if (weekCount === 1) return 'border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] shadow-[0_0_10px_rgba(245,158,11,0.1)]';
    if (weekCount === 2) return 'border-slate-400/30 hover:shadow-[0_0_20px_rgba(148,163,184,0.3)] shadow-[0_0_10px_rgba(148,163,184,0.1)]';
    if (weekCount === 3) return 'border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] shadow-[0_0_10px_rgba(250,204,21,0.1)]';
    if (weekCount === 4) return 'border-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] shadow-[0_0_10px_rgba(34,211,238,0.1)]';
    if (weekCount >= 8) return 'border-fuchsia-500/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] shadow-[0_0_10px_rgba(217,70,239,0.1)]';
    return 'border-emerald-400/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] shadow-[0_0_10px_rgba(52,211,153,0.1)]';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
          <div className="text-amber-500 font-mono text-sm tracking-widest uppercase animate-pulse">Loading Rewards Vault...</div>
        </div>
      </div>
    );
  }

  const weeklyRewards = rewards.filter(r => r.reward_type === 'weekly').sort((a, b) => a.week_count - b.week_count);
  const monthlyRewards = rewards.filter(r => r.reward_type === 'monthly');

  return (
    <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
      <Navbar />
      <style>{`
        .dash-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .dash-input {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #3D52A0;
          transition: all 0.3s ease;
        }
        .dash-input:focus {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
          outline: none;
        }
        .dash-btn {
          background: linear-gradient(to right, rgba(14, 165, 233, 0.8), rgba(59, 130, 246, 0.8));
          color: white;
          border: 1px solid rgba(14, 165, 233, 0.5);
          transition: all 0.3s ease;
        }
        .dash-btn:hover {
          background: linear-gradient(to right, rgba(14, 165, 233, 1), rgba(59, 130, 246, 1));
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
        }
      `}</style>
      <div className="max-w-7xl mx-auto py-6 px-3 sm:px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-amber-500 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Trophy size={42} strokeWidth={2} />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-wide">
          </h1>
          <p className="text-amber-500/60 font-mono text-sm tracking-widest uppercase">
            Unlock & Archive Milestones
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <button
            onClick={() => setShowRewardForm(!showRewardForm)}
            className="px-6 py-3 dash-btn rounded-xl font-semibold flex items-center gap-2 text-xs tracking-widest uppercase"
          >
            <Sparkles size={16} />
            Generate Custom
          </button>
          <button
            onClick={addDefaultWeeklyRewards}
            className="px-6 py-3 bg-amber-600/20 text-amber-500 border border-amber-500/30 hover:bg-amber-600/40 rounded-xl transition-all font-semibold shadow-[0_0_10px_rgba(245,158,11,0.1)] flex items-center gap-2 text-xs tracking-widest uppercase"
          >
            <Zap size={16} />
            Inject Defaults
          </button>
        </div>

        {/* Add Reward Form */}
        {showRewardForm && (
          <div className="mb-10 dash-glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h4 className="text-xl font-bold text-gray-200 flex items-center gap-3">
                <Gift className="text-sky-400" size={24} />
                Instantiate New Reward
              </h4>
              <button
                onClick={() => {
                  setShowRewardForm(false);
                  setNewReward({
                    reward_type: 'weekly',
                    week_count: '',
                    reward_title: '',
                    reward_description: '',
                    image_url: ''
                  });
                  setImagePreview(null);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-white/10"
              >
                <X className="text-gray-400" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Reward Architecture</label>
                  <select
                    value={newReward.reward_type}
                    onChange={(e) => setNewReward({ ...newReward, reward_type: e.target.value })}
                    className="w-full dash-input px-4 py-3 rounded-xl appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="weekly" className="bg-gray-900 text-gray-300">Weekly Cycle</option>
                    <option value="monthly" className="bg-gray-900 text-gray-300">Monthly Phase</option>
                  </select>
                </div>

                {newReward.reward_type === 'weekly' && (
                  <div>
                    <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Cycle Requirement (Week Count)</label>
                    <input
                      type="number"
                      min="1"
                      value={newReward.week_count}
                      onChange={(e) => setNewReward({ ...newReward, week_count: e.target.value })}
                      placeholder="e.g. 1, 2, 4..."
                      className="w-full dash-input px-4 py-3 rounded-xl placeholder-gray-600"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Designation Name</label>
                  <input
                    type="text"
                    value={newReward.reward_title}
                    onChange={(e) => setNewReward({ ...newReward, reward_title: e.target.value })}
                    placeholder="e.g. Bronze Focus Badge"
                    className="w-full dash-input px-4 py-3 rounded-xl placeholder-gray-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Telemetry Descriptor (Optional)</label>
                  <textarea
                    value={newReward.reward_description}
                    onChange={(e) => setNewReward({ ...newReward, reward_description: e.target.value })}
                    placeholder="e.g. Survived the first week of intensive routines."
                    className="w-full dash-input px-4 py-3 rounded-xl placeholder-gray-600 resize-none"
                    rows="3"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Thumbnail URI (Optional)</label>
                  <input
                    type="text"
                    value={newReward.image_url}
                    onChange={handleImageChange}
                    placeholder="https://..."
                    className="w-full dash-input px-4 py-3 rounded-xl placeholder-gray-600"
                  />
                </div>

                <label className="text-[10px] font-mono tracking-widest uppercase text-gray-400 mb-2 block">Visual Preview</label>
                {imagePreview ? (
                  <div className="p-2 bg-gray-900/50 rounded-xl border border-white/5 h-48">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border border-white/5 opacity-80"
                      onError={() => setImagePreview(null)}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-900/30 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center h-48">
                    <FileImage className="text-gray-700 mb-2" size={40} />
                    <p className="text-[10px] font-mono tracking-widest uppercase text-gray-600">Awaiting visual input</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
              <button
                onClick={addReward}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 border border-emerald-500/50 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase"
              >
                <Check size={18} />
                Deploy Reward
              </button>
            </div>
          </div>
        )}

        {/* Weekly Rewards Section */}
        {weeklyRewards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <Award className="text-amber-500" size={28} />
              Cycle Rewards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {weeklyRewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`dash-glass rounded-2xl p-5 transition-all duration-300 group relative ${getRewardBorderGlow(reward.week_count, reward.unlocked)} ${!reward.unlocked && 'opacity-60 saturate-50 hover:opacity-80'}`}
                >
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="absolute top-3 right-3 p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Delete reward"
                  >
                    <Trash2 className="text-rose-400" size={16} />
                  </button>

                  <div className="flex flex-col h-full">
                    {reward.image_url && (
                      <div
                        className="mb-4 rounded-xl overflow-hidden cursor-pointer h-32 relative group/img -mx-1"
                        onClick={() => setSelectedImage(reward.image_url)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10 opacity-50 group-hover/img:opacity-20 transition-opacity"></div>
                        <img
                          src={reward.image_url}
                          alt={reward.reward_title}
                          className={`w-full h-full object-cover transition-all duration-500 hover:scale-110 ${!reward.unlocked ? 'grayscale' : ''}`}
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br border border-white/10 ${getRewardGradient(reward.week_count, reward.unlocked)}`}>
                        {getRewardIcon(reward.week_count)}
                      </div>
                      <div className="flex-1 mt-0.5">
                        <h4 className={`text-sm font-bold truncate ${reward.unlocked ? 'text-gray-200' : 'text-gray-400'}`} title={reward.reward_title}>{reward.reward_title}</h4>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${reward.unlocked
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-800 text-gray-500 border-gray-700'
                            }`}>
                            Week {reward.week_count}
                          </span>
                        </div>
                      </div>
                    </div>

                    {reward.reward_description && (
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 md:line-clamp-3 ext-left font-light leading-relaxed flex-1">{reward.reward_description}</p>
                    )}

                    <div className="mt-auto pt-4 border-t border-white/5">
                      {reward.unlocked ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono tracking-widest uppercase">
                            <Sparkles size={12} />
                            <span>Obtained</span>
                          </div>
                          {reward.unlocked_on && (
                            <p className="text-[10px] text-gray-500 font-mono">
                              {new Date(reward.unlocked_on).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                          <span>🔒 Encrypted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Rewards Section */}
        {monthlyRewards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
              <Trophy className="text-fuchsia-400" size={28} />
              Phase Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {monthlyRewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`dash-glass rounded-2xl p-5 transition-all duration-300 group relative ${reward.unlocked
                    ? 'border-fuchsia-500/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] shadow-[0_0_10px_rgba(217,70,239,0.1)]'
                    : 'border-white/5 hover:border-white/10 opacity-60 saturate-50 hover:opacity-80'
                    }`}
                >
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="absolute top-3 right-3 p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Delete reward"
                  >
                    <Trash2 className="text-rose-400" size={16} />
                  </button>

                  <div className="flex flex-col h-full">
                    {reward.image_url && (
                      <div
                        className="mb-4 rounded-xl overflow-hidden cursor-pointer h-32 relative group/img -mx-1"
                        onClick={() => setSelectedImage(reward.image_url)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10 opacity-50 group-hover/img:opacity-20 transition-opacity"></div>
                        <img
                          src={reward.image_url}
                          alt={reward.reward_title}
                          className={`w-full h-full object-cover transition-all duration-500 hover:scale-110 ${!reward.unlocked ? 'grayscale' : ''}`}
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl border border-white/10 ${reward.unlocked
                        ? 'bg-gradient-to-br from-fuchsia-500 to-rose-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-500'
                        }`}>
                        <Trophy size={28} />
                      </div>
                      <div className="flex-1 mt-0.5">
                        <h4 className={`text-sm font-bold truncate ${reward.unlocked ? 'text-gray-200' : 'text-gray-400'}`} title={reward.reward_title}>{reward.reward_title}</h4>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${reward.unlocked
                            ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                            : 'bg-gray-800 text-gray-500 border-gray-700'
                            }`}>
                            Phase
                          </span>
                        </div>
                      </div>
                    </div>

                    {reward.reward_description && (
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 md:line-clamp-3 text-left font-light leading-relaxed flex-1">{reward.reward_description}</p>
                    )}

                    <div className="mt-auto pt-4 border-t border-white/5">
                      {reward.unlocked ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-fuchsia-400 text-[10px] font-mono tracking-widest uppercase">
                            <Sparkles size={12} />
                            <span>Obtained</span>
                          </div>
                          {reward.unlocked_on && (
                            <p className="text-[10px] text-gray-500 font-mono">
                              {new Date(reward.unlocked_on).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                          <span>🔒 Encrypted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {rewards.length === 0 && (
          <div className="text-center py-20 dash-glass rounded-3xl mt-8">
            <div className="inline-flex items-center justify-center p-6 bg-gray-900/50 border border-white/5 rounded-3xl mb-6">
              <Gift className="text-gray-600" size={56} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Vault Empty</h3>
            <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-8">Deploy milestones to begin tracking</p>
            <button
              onClick={() => setShowRewardForm(true)}
              className="px-8 py-4 dash-btn rounded-xl font-semibold text-xs tracking-widest uppercase"
            >
              Initialize First Reward
            </button>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] animate-slideIn">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 bg-gray-900 border border-white/10 rounded-xl hover:bg-gray-800 transition-colors text-[#3D52A0]"
              >
                <X size={24} />
              </button>
              <img
                src={selectedImage}
                alt="Detailed Reward View"
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

      </div>
    </div >
  );
}