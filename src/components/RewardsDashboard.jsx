import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Award, Star, Sparkles, Medal, Crown, Zap, Trash2, X, Check, FileImage, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  Card, CardBody, Badge, Button, IconButton, Input, Textarea, Select,
  Modal, ConfirmDialog, EmptyState, SkeletonCard, useToast,
} from './ui';
import { syncAchievementRewards } from '../utils/syncAchievementRewards';

const supabaseUrl = 'https://qwjujuvtfqahapohhfzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anVqdXZ0ZnFhaGFwb2hoZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTEyMzYsImV4cCI6MjEwMzY2NzIzNn0.CEnppxWU5d4jKGtjlB6u3U2V_3hjgqUxzoU1KRx7fZI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RewardsDashboard() {
  const toast = useToast();
  const [rewards, setRewards] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newReward, setNewReward] = useState({
    reward_type: 'weekly',
    week_count: '',
    achievement_id: '',
    reward_title: '',
    reward_description: '',
    image_url: ''
  });

  useEffect(() => {
    loadRewards();
    loadAchievements();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    try {
      await syncAchievementRewards(supabase);
      const { data: achievementsList } = await supabase
        .from('achievements')
        .select('id, title');
      setAchievements(achievementsList || []);

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

  const loadAchievements = async () => {
    try {
      const { data } = await supabase
        .from('achievements')
        .select('id, title')
        .order('title', { ascending: true });
      setAchievements(data || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  };

  const achievementTitle = (id) => achievements.find((a) => a.id === id)?.title || 'Deleted achievement';

  const resetForm = () => {
    setShowRewardForm(false);
    setNewReward({
      reward_type: 'weekly',
      week_count: '',
      achievement_id: '',
      reward_title: '',
      reward_description: '',
      image_url: ''
    });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const url = e.target.value;
    setNewReward({ ...newReward, image_url: url });
    setImagePreview(url);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be 5MB or smaller');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('reward-images')
        .upload(path, file, { contentType: file.type });
      if (error) throw error;

      const { data } = supabase.storage.from('reward-images').getPublicUrl(path);
      setNewReward((prev) => ({ ...prev, image_url: data.publicUrl }));
      setImagePreview(data.publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Failed to upload image: ' + error.message);
    }
    setUploading(false);
  };

  const addReward = async () => {
    if (!newReward.reward_title.trim()) {
      toast.error('Please enter a reward title');
      return;
    }

    if (newReward.reward_type === 'weekly' && !newReward.week_count) {
      toast.error('Please enter week count for weekly rewards');
      return;
    }

    if (newReward.reward_type === 'achievement' && !newReward.achievement_id) {
      toast.error('Please select which achievement unlocks this reward');
      return;
    }

    if (newReward.reward_type === 'achievement' && !newReward.achievement_id) {
      alert('Please select an achievement to link');
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

      if (newReward.reward_type === 'achievement') {
        rewardData.achievement_id = newReward.achievement_id;
      }

      const { error } = await supabase
        .from('rewards')
        .insert([rewardData])
        .select()
        .single();

      if (error) throw error;

      await loadRewards();
      resetForm();
      toast.success('Reward added successfully!');
    } catch (error) {
      console.error("Error adding reward:", error);
      toast.error('Failed to add reward: ' + error.message);
    }
  };

  const deleteReward = async (rewardId) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;

      await loadRewards();
      toast.success('Reward deleted successfully!');
    } catch (error) {
      console.error("Error deleting reward:", error);
      toast.error('Failed to delete reward: ' + error.message);
    }
  };

  const confirmDeleteReward = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    await deleteReward(id);
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
      const { error } = await supabase
        .from('rewards')
        .insert(defaultRewards)
        .select();

      if (error) throw error;

      await loadRewards();
      toast.success('Default weekly rewards added successfully!');
    } catch (error) {
      console.error("Error adding default rewards:", error);
      toast.error('Failed to add default rewards: ' + error.message);
    }
  };

  const getRewardIcon = (weekCount) => {
    if (!weekCount) return <Gift size={24} strokeWidth={2.25} />;
    if (weekCount === 1) return <Medal size={24} strokeWidth={2.25} />;
    if (weekCount === 2) return <Star size={24} strokeWidth={2.25} />;
    if (weekCount === 3) return <Award size={24} strokeWidth={2.25} />;
    if (weekCount === 4) return <Trophy size={24} strokeWidth={2.25} />;
    if (weekCount >= 8) return <Crown size={24} strokeWidth={2.25} />;
    return <Sparkles size={24} strokeWidth={2.25} />;
  };

  const getRewardGradient = (weekCount, unlocked) => {
    if (!unlocked) return 'bg-[var(--surface-hover)] text-[var(--text-muted)]';
    return 'bg-primary/10 text-primary';
  };

  const getRewardBorderGlow = (weekCount, unlocked) => {
    if (!unlocked) return 'border-[var(--border)] opacity-60 hover:opacity-90';
    return 'border-[var(--border)] hover:shadow-[var(--shadow-md)]';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const weeklyRewards = rewards.filter(r => r.reward_type === 'weekly').sort((a, b) => a.week_count - b.week_count);
  const monthlyRewards = rewards.filter(r => r.reward_type === 'monthly');
  const achievementRewards = rewards.filter(r => r.reward_type === 'achievement');

  const renderRewardCard = (reward, { icon, badgeLabel, lockedLabel = 'Locked' }) => (
    <Card
      key={reward.id}
      className={`p-5 transition-all duration-200 group relative ${getRewardBorderGlow(reward.week_count, reward.unlocked)} ${!reward.unlocked ? 'opacity-70' : ''}`}
    >
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton variant="danger" label="Delete reward" onClick={() => setDeleteTarget(reward.id)}>
          <Trash2 size={16} />
        </IconButton>
      </div>

      <div className="flex flex-col h-full">
        {reward.image_url && (
          <div
            className="mb-4 rounded-lg overflow-hidden cursor-pointer h-32 relative -mx-1"
            onClick={() => setSelectedImage(reward.image_url)}
          >
            <img
              src={reward.image_url}
              alt={reward.reward_title}
              className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${!reward.unlocked ? 'grayscale' : ''}`}
            />
          </div>
        )}

        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2.5 rounded-xl ${getRewardGradient(reward.week_count, reward.unlocked)}`}>
            {icon}
          </div>
          <div className="flex-1 mt-0.5 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--text)] truncate" title={reward.reward_title}>{reward.reward_title}</h4>
            <div className="mt-1.5">
              <Badge variant={reward.unlocked ? 'success' : 'neutral'}>{badgeLabel}</Badge>
            </div>
          </div>
        </div>

        {reward.reward_description && (
          <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2 md:line-clamp-3 font-normal leading-relaxed flex-1">{reward.reward_description}</p>
        )}

        <div className="mt-auto pt-4 border-t border-[var(--border)]">
          {reward.unlocked ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
                <Sparkles size={12} />
                <span>Unlocked</span>
              </div>
              {reward.unlocked_on && (
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(reward.unlocked_on).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-medium">
              <Lock size={12} />
              <span>{lockedLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-primary/10 text-primary">
          <Trophy size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Rewards</h1>
        <p className="text-sm text-[var(--text-muted)]">Unlock and track your milestones.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="primary" icon={<Sparkles size={16} />} onClick={() => setShowRewardForm(true)}>
          New Reward
        </Button>
        <Button variant="secondary" icon={<Zap size={16} />} onClick={addDefaultWeeklyRewards}>
          Add Default Rewards
        </Button>
      </div>

      {/* Weekly Rewards Section */}
      {weeklyRewards.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <Award className="text-primary" size={20} />
            Weekly Rewards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {weeklyRewards.map((reward) =>
              renderRewardCard(reward, {
                icon: getRewardIcon(reward.week_count),
                badgeLabel: `Week ${reward.week_count}`,
              })
            )}
          </div>
        </div>
      )}

      {/* Monthly Rewards Section */}
      {monthlyRewards.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <Trophy className="text-primary" size={20} />
            Monthly Rewards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {monthlyRewards.map((reward) =>
              renderRewardCard(reward, {
                icon: <Trophy size={24} strokeWidth={2.25} />,
                badgeLabel: 'Phase',
              })
            )}
          </div>
        </div>
      )}

      {/* Achievement-Linked Rewards Section */}
      {achievementRewards.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
            <Gift className="text-primary" size={20} />
            Achievement Rewards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {achievementRewards.map((reward) =>
              renderRewardCard(reward, {
                icon: <Gift size={24} strokeWidth={2.25} />,
                badgeLabel: achievementTitle(reward.achievement_id),
                lockedLabel: 'Completes achievement to unlock',
              })
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rewards.length === 0 && (
        <Card>
          <EmptyState
            icon={<Gift size={20} />}
            title="No rewards yet"
            message="Create your first reward to start tracking milestones."
            action={<Button variant="primary" onClick={() => setShowRewardForm(true)}>New Reward</Button>}
          />
        </Card>
      )}

      {/* Add Reward Modal */}
      <Modal
        open={showRewardForm}
        onClose={resetForm}
        title="New Reward"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" icon={<Check size={16} />} onClick={addReward}>Add Reward</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <Select
              label="Reward Type"
              value={newReward.reward_type}
              onChange={(e) => setNewReward({ ...newReward, reward_type: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="achievement">Achievement-Linked</option>
            </Select>

            {newReward.reward_type === 'weekly' && (
              <Input
                label="Week Count"
                type="number"
                min="1"
                value={newReward.week_count}
                onChange={(e) => setNewReward({ ...newReward, week_count: e.target.value })}
                placeholder="e.g. 1, 2, 4..."
              />
            )}

            {newReward.reward_type === 'achievement' && (
              <Select
                label="Unlocks When Achievement Completes"
                value={newReward.achievement_id}
                onChange={(e) => setNewReward({ ...newReward, achievement_id: e.target.value })}
                helperText={achievements.length === 0 ? 'No achievements found — create one on the Achievements page first.' : undefined}
              >
                <option value="">Select an achievement...</option>
                {achievements.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </Select>
            )}

            <Input
              label="Reward Title"
              type="text"
              value={newReward.reward_title}
              onChange={(e) => setNewReward({ ...newReward, reward_title: e.target.value })}
              placeholder="e.g. Bronze Focus Badge"
            />

            <Textarea
              label="Description (Optional)"
              value={newReward.reward_description}
              onChange={(e) => setNewReward({ ...newReward, reward_description: e.target.value })}
              placeholder="e.g. Survived the first week of intensive routines."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5 block">Upload Image (Optional)</label>
              <label className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-field)] border border-dashed border-[var(--field-border)] text-sm text-[var(--text-muted)] hover:border-primary/50 hover:text-primary bg-[var(--surface-hover)] transition-all cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                <FileImage size={16} />
                {uploading ? 'Uploading...' : 'Choose image from device'}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <Input
              label="Or Image URL (Optional)"
              type="text"
              value={newReward.image_url}
              onChange={handleImageChange}
              placeholder="https://..."
            />

            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Preview</label>
              {imagePreview ? (
                <div className="p-2 bg-[var(--surface-hover)] rounded-xl border border-[var(--border)] h-48">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => setImagePreview(null)}
                  />
                </div>
              ) : (
                <div className="bg-[var(--surface-hover)] rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center h-48">
                  <FileImage className="text-[var(--text-muted)] mb-2" size={32} />
                  <p className="text-xs text-[var(--text-muted)]">No image yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteReward}
        title="Delete reward"
        message="Are you sure you want to delete this reward?"
        confirmLabel="Delete"
      />

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-[1500] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <div className="absolute -top-12 right-0">
              <IconButton
                label="Close"
                className="bg-[var(--surface)] border border-[var(--border)]"
                onClick={() => setSelectedImage(null)}
              >
                <X size={20} />
              </IconButton>
            </div>
            <img
              src={selectedImage}
              alt="Reward detail"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-[var(--border)]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  );
}
