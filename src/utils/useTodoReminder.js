import { useEffect, useRef } from 'react';
import { showNotification } from './notifications';

export function useTodoReminder(todos) {
  const congratsSent = useRef(false);

  useEffect(() => {
    if (Notification.permission !== 'granted' || todos.length === 0) return;

    const pendingTodos = todos.filter(t => !t.completed);
    const allDone = pendingTodos.length === 0;

    // Congratulations notification when all tasks completed
    if (allDone && !congratsSent.current) {
      congratsSent.current = true;
      showNotification(
        '🎉 All Tasks Completed!',
        `Amazing! You crushed all ${todos.length} tasks today. Keep it up!`
      );
      return;
    }

    // Reset congrats flag if new tasks added
    if (!allDone) congratsSent.current = false;

    // No tasks added yet reminder
    if (todos.length === 0) {
      showNotification('📝 No Tasks Yet!', 'Add your tasks for today and get started!');
      return;
    }

    const interval = setInterval(() => {
      const currentPending = todos.filter(t => !t.completed);
      if (currentPending.length === 0) {
        clearInterval(interval);
        return;
      }
      const randomTodo = currentPending[Math.floor(Math.random() * currentPending.length)];
      showNotification(
        `⚡ ${currentPending.length} task${currentPending.length > 1 ? 's' : ''} pending`,
        randomTodo.title
      );
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [todos]);
}