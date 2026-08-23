import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TodoList from "./ToDoList";
import PerformanceDashboard from "./PerformanceDashboard";
import RewardsDashboard from "./RewardsDashboard";
import PlansPage from "./PlansPage";
import QuoteTabs from "./QuoteTabs";
import PreviousTodos from "./PreviousTodos";
import AchievementsPage from "./AchievementsPage";
import FriendsPage from "./FriendsPage";
import MoneyPage from "./MoneyPage";
import MannersPage from "./MannersPage";
import LifeSuccessRate from "./LifeSuccessRate";
import MoodTracker from "./MoodTracker";
import HabitStreaks from "./HabitStreaks";
import WeeklyReportCard from "./WeeklyReportCard";
import PomodoroTimer from "./PomodoroTimer";
import DailyJournal from "./DailyJournal";
import SkillsTracker from "./SkillsTracker";
import BooksTracker from "./BooksTracker";
import LevelSystem from "./LevelSystem";
import BossChallenge from "./BossChallenge";
import GalleryPage from "./GalleryPage";
import MirrorTalk from "./MirrorTalk";
import FearCrusher from "./FearCrusher";
import ComfortZone from "./ComfortZone";
import AICoach from "./AICoach";
import ScriptWriter from "./ScriptWriter";
import SettingsPage from "./SettingsPage";

import JobFinder from "./JobFinder";
import WorkoutDiet from "./WorkoutDiet";
import GymTracker from "./GymTracker";

function RoutesConfig() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TodoList />} />
                <Route path="/performance-dashboard" element={<PerformanceDashboard />} />
                <Route path="/reward-dashboard" element={<RewardsDashboard />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/inspirations" element={<QuoteTabs />} />
                <Route path="/previous-todos" element={<PreviousTodos />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/freinds" element={<FriendsPage />} />
                <Route path="/money" element={<MoneyPage />} />
                <Route path="/manners" element={<MannersPage />} />
                <Route path="/life-success" element={<LifeSuccessRate />} />
                <Route path="/mood" element={<MoodTracker />} />
                <Route path="/habits" element={<HabitStreaks />} />
                <Route path="/report-card" element={<WeeklyReportCard />} />
                <Route path="/pomodoro" element={<PomodoroTimer />} />
                <Route path="/journal" element={<DailyJournal />} />
                <Route path="/skills" element={<SkillsTracker />} />
                <Route path="/books" element={<BooksTracker />} />
                <Route path="/level" element={<LevelSystem />} />
                <Route path="/boss" element={<BossChallenge />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/mirror-talk" element={<MirrorTalk />} />
                <Route path="/fear-crusher" element={<FearCrusher />} />
                <Route path="/comfort-zone" element={<ComfortZone />} />
                <Route path="/ai-coach" element={<AICoach />} />
                <Route path="/script-writer" element={<ScriptWriter />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/job-finder" element={<JobFinder />} />
                <Route path="/workout-diet" element={<WorkoutDiet />} />
                <Route path="/gym" element={<GymTracker />} />
            </Routes>
        </Router>
    );
}

export default RoutesConfig;