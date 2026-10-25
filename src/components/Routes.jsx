import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import TodoList from "./ToDoList";
import ProgressHub from "./ProgressHub";
import ReflectionsHub from "./ReflectionsHub";
import CaptureInbox from "./CaptureInbox";
import PlansPage from "./PlansPage";
import QuoteTabs from "./QuoteTabs";
import PreviousTodos from "./PreviousTodos";
import AchievementsPage from "./AchievementsPage";
import FriendsPage from "./FriendsPage";
import MoneyPage from "./MoneyPage";
import MannersPage from "./MannersPage";
import MoodTracker from "./MoodTracker";
import HabitStreaks from "./HabitStreaks";
import PomodoroTimer from "./PomodoroTimer";
import SkillsTracker from "./SkillsTracker";
import BooksTracker from "./BooksTracker";
import GalleryPage from "./GalleryPage";
import AICoach from "./AICoach";
import ScriptWriter from "./ScriptWriter";
import SettingsPage from "./SettingsPage";

import JobFinder from "./JobFinder";
import WorkoutDiet from "./WorkoutDiet";
import GymTracker from "./GymTracker";

function RoutesConfig() {
    return (
        <Router>
            <AppLayout>
            <Routes>
                <Route path="/" element={<TodoList />} />
                <Route path="/progress" element={<ProgressHub />} />
                <Route path="/capture" element={<CaptureInbox />} />
                {/* Old gamification routes redirect into the consolidated Progress page */}
                <Route path="/performance-dashboard" element={<Navigate to="/progress" replace />} />
                <Route path="/reward-dashboard" element={<Navigate to="/progress" replace />} />
                <Route path="/life-success" element={<Navigate to="/progress" replace />} />
                <Route path="/report-card" element={<Navigate to="/progress" replace />} />
                <Route path="/level" element={<Navigate to="/progress" replace />} />
                <Route path="/boss" element={<Navigate to="/progress" replace />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/inspirations" element={<QuoteTabs />} />
                <Route path="/previous-todos" element={<PreviousTodos />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/freinds" element={<FriendsPage />} />
                <Route path="/money" element={<MoneyPage />} />
                <Route path="/manners" element={<MannersPage />} />
                <Route path="/mood" element={<MoodTracker />} />
                <Route path="/habits" element={<HabitStreaks />} />
                <Route path="/pomodoro" element={<PomodoroTimer />} />
                <Route path="/reflections" element={<ReflectionsHub />} />
                {/* Old mindset-journal routes redirect into the consolidated Reflections page */}
                <Route path="/journal" element={<Navigate to="/reflections" replace />} />
                <Route path="/mirror-talk" element={<Navigate to="/reflections" replace />} />
                <Route path="/fear-crusher" element={<Navigate to="/reflections" replace />} />
                <Route path="/comfort-zone" element={<Navigate to="/reflections" replace />} />
                <Route path="/patience-marker" element={<Navigate to="/reflections" replace />} />
                <Route path="/skills" element={<SkillsTracker />} />
                <Route path="/books" element={<BooksTracker />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/ai-coach" element={<AICoach />} />
                <Route path="/script-writer" element={<ScriptWriter />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/job-finder" element={<JobFinder />} />
                <Route path="/workout-diet" element={<WorkoutDiet />} />
                <Route path="/gym" element={<GymTracker />} />
            </Routes>
            </AppLayout>
        </Router>
    );
}

export default RoutesConfig;