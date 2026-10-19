import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Users,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
}

interface MemberTaskAssignment {
  memberId: string;
  memberName: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  date: string;
  members: MemberTaskAssignment[];
  createdAt: number;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Amina (Leader)' },
  { id: 'm-2', name: 'Bilal Khan' },
  { id: 'm-3', name: 'Zainab Ahmed' },
  { id: 'm-4', name: 'Hamza Tariq' },
];

const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Finalize Chapter 3 System Architecture & Database Schema',
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 3600000 * 5,
    members: [
      { memberId: 'm-1', memberName: 'Amina (Leader)', completed: true },
      { memberId: 'm-2', memberName: 'Bilal Khan', completed: true },
      { memberId: 'm-4', memberName: 'Hamza Tariq', completed: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Prepare demo slides for upcoming weekly supervisor meeting',
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now() - 3600000 * 24,
    members: [
      { memberId: 'm-1', memberName: 'Amina (Leader)', completed: true },
      { memberId: 'm-3', memberName: 'Zainab Ahmed', completed: true },
    ],
  },
  {
    id: 'task-3',
    title: 'Complete unit test suite and module documentation',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: Date.now() - 3600000 * 2,
    members: [
      { memberId: 'm-2', memberName: 'Bilal Khan', completed: false },
      { memberId: 'm-3', memberName: 'Zainab Ahmed', completed: false },
      { memberId: 'm-4', memberName: 'Hamza Tariq', completed: false },
    ],
  },
];

const STORAGE_KEYS = {
  TASKS: 'fyp_tracker_tasks_v1',
  MEMBERS: 'fyp_tracker_members_v1',
  DISMISSED_NOTICE: 'fyp_tracker_notice_dismissed_v1',
};

// Quick avatar colors generator based on member name
function getAvatarBg(name: string): string {
  const colors = [
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-pink-100 text-pink-700 border-pink-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function App() {
  // Members state loaded from localStorage
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load members from localStorage', e);
    }
    return DEFAULT_MEMBERS;
  });

  // Tasks state loaded from localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_SAMPLE_TASKS;
  });

  // Notice dismissal
  const [showNotice, setShowNotice] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.DISMISSED_NOTICE) !== 'true';
  });

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ title?: string; date?: string; members?: string }>({});

  // Manage members modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [memberError, setMemberError] = useState('');

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Task Modal/State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to persist members', e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to persist tasks', e);
    }
  }, [tasks]);

  const dismissNotice = () => {
    setShowNotice(false);
    localStorage.setItem(STORAGE_KEYS.DISMISSED_NOTICE, 'true');
  };

  // Check if a task is fully completed
  const isTaskCompleted = (task: Task): boolean => {
    if (!task.members || task.members.length === 0) return false;
    return task.members.every((m) => m.completed);
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter((t) => isTaskCompleted(t)).length, [tasks]);
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Toggle member assignment selection in create form
  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
    if (formErrors.members) {
      setFormErrors((prev) => ({ ...prev, members: undefined }));
    }
  };

  const selectAllMembers = () => {
    setSelectedMemberIds(members.map((m) => m.id));
    if (formErrors.members) {
      setFormErrors((prev) => ({ ...prev, members: undefined }));
    }
  };

  const deselectAllMembers = () => {
    setSelectedMemberIds([]);
  };

  // Form Submission
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { title?: string; date?: string; members?: string } = {};
    if (!taskTitle.trim()) {
      errors.title = 'Please enter a task title.';
    }
    if (!taskDate) {
      errors.date = 'Please select a date.';
    }
    if (selectedMemberIds.length === 0) {
      errors.members = 'Select at least one team member for this task.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Build assigned members list with completed = false
    const assignedMembers: MemberTaskAssignment[] = selectedMemberIds.map((mId) => {
      const found = members.find((m) => m.id === mId);
      return {
        memberId: mId,
        memberName: found ? found.name : 'Unknown Member',
        completed: false,
      };
    });

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      date: taskDate,
      members: assignedMembers,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setTaskTitle('');
    setSelectedMemberIds([]);
    setFormErrors({});
  };

  // Toggle member completed checkbox in a task
  const toggleMemberTaskCheckbox = (taskId: string, memberId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        const updatedMembers = task.members.map((m) => {
          if (m.memberId === memberId) {
            return { ...m, completed: !m.completed };
          }
          return m;
        });
        return { ...task, members: updatedMembers };
      })
    );
  };

  // Mark all members in a task completed or uncompleted
  const markAllInTask = (taskId: string, completed: boolean) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          members: task.members.map((m) => ({ ...m, completed })),
        };
      })
    );
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDeleteConfirmTaskId(null);
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      setMemberError('Member name cannot be empty.');
      return;
    }
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setMemberError('A team member with this name already exists.');
      return;
    }

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: trimmed,
    };
    setMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
    setMemberError('');
  };

  // Edit Member Name
  const handleSaveMemberEdit = (id: string) => {
    const trimmed = editingMemberName.trim();
    if (!trimmed) {
      setMemberError('Member name cannot be empty.');
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: trimmed } : m))
    );

    // Also update existing task assignments memberName
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        members: task.members.map((m) =>
          m.memberId === id ? { ...m, memberName: trimmed } : m
        ),
      }))
    );

    setEditingMemberId(null);
    setEditingMemberName('');
    setMemberError('');
  };

  // Delete Member
  const handleDeleteMember = (id: string) => {
    if (members.length <= 1) {
      setMemberError('You must have at least one team member.');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    // Also remove from task selections
    setSelectedMemberIds((prev) => prev.filter((mId) => mId !== id));
    setMemberError('');
  };

  // Reset to default sample tasks
  const handleResetSampleData = () => {
    if (window.confirm('Reset tasks to sample FYP tasks? This will overwrite your current list.')) {
      setTasks(INITIAL_SAMPLE_TASKS);
      setMembers(DEFAULT_MEMBERS);
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      const isComplete = isTaskCompleted(task);
      if (statusFilter === 'completed' && !isComplete) return false;
      if (statusFilter === 'pending' && isComplete) return false;

      // Member filter
      if (memberFilter !== 'all') {
        const hasMember = task.members.some((m) => m.memberId === memberFilter);
        if (!hasMember) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesMember = task.members.some((m) => m.memberName.toLowerCase().includes(q));
        if (!matchesTitle && !matchesMember) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, memberFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-200">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  FYP Task Tracker
                </h1>
                <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200 hidden sm:inline-block">
                  Team Leader MVP
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track daily tasks and team member completion for your Final Year Project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
              title="Manage FYP Team Members"
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Team Members ({members.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Local Storage Notice Banner */}
        {showNotice && (
          <div className="bg-purple-50/90 border border-purple-200 text-purple-900 rounded-xl p-3.5 sm:p-4 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3 text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-900">Local Browser Storage Notice:</span>{' '}
                All tasks, assignments, and check statuses are saved in your browser's{' '}
                <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-mono">
                  localStorage
                </code>
                . Your data will persist after refreshing, but will not automatically sync across different devices or separate member computers.
              </div>
            </div>
            <button
              onClick={dismissNotice}
              className="text-purple-500 hover:text-purple-800 p-1 rounded-md transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Tasks */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tasks</p>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalTasks}</h2>
              <p className="text-xs text-slate-400 mt-1">Assigned to team</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Tasks</p>
              <h2 className="text-3xl font-bold text-purple-700 mt-1">{completedTasks}</h2>
              <p className="text-xs text-purple-600/80 mt-1">
                {completionPercentage}% completion rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Tasks</p>
              <h2 className="text-3xl font-bold text-amber-600 mt-1">{pendingTasks}</h2>
              <p className="text-xs text-slate-400 mt-1">Awaiting member checkoffs</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Task Creation Form Card */}
        <section className="bg-white rounded-2xl border border-purple-100 shadow-xs p-5 sm:p-6 transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Create New FYP Task</h2>
            </div>
            <span className="text-xs text-slate-400">Fill details and assign members</span>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Task Title */}
              <div className="md:col-span-2">
                <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={taskTitle}
                  onChange={(e) => {
                    setTaskTitle(e.target.value);
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g., Implement login validation, Prepare FYP presentation slides"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                    formErrors.title
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-slate-200 focus:border-purple-500 focus:ring-purple-200'
                  } focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Task Date */}
              <div>
                <label htmlFor="task-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="task-date"
                    type="date"
                    value={taskDate}
                    onChange={(e) => {
                      setTaskDate(e.target.value);
                      if (formErrors.date) setFormErrors((prev) => ({ ...prev, date: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                      formErrors.date
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-purple-200'
                    } focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
                {formErrors.date && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.date}
                  </p>
                )}
              </div>
            </div>

            {/* Team Members Assignment Checkboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Assign to Team Members <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllMembers}
                    className="text-purple-600 hover:text-purple-800 font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllMembers}
                    className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {members.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-sm cursor-pointer select-none transition-all ${
                        isSelected
                          ? 'border-purple-300 bg-purple-50/70 text-purple-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMemberSelection(member.id)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                      />
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border shrink-0 ${getAvatarBg(
                          member.name
                        )}`}
                      >
                        {getInitials(member.name)}
                      </span>
                      <span className="truncate font-medium text-xs sm:text-sm">{member.name}</span>
                    </label>
                  );
                })}
              </div>

              {formErrors.members && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.members}
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm rounded-xl shadow-sm shadow-purple-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </form>
        </section>

        {/* Task List Header & Controls */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Team Tasks</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tick each member's box when their portion of the task is finished
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search box */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalTasks})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingTasks})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Done ({completedTasks})
                </button>
              </div>

              {/* Member Filter Dropdown */}
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
              >
                <option value="all">All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Cards List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No tasks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery || statusFilter !== 'all' || memberFilter !== 'all'
                  ? 'No tasks match your active filter or search criteria.'
                  : 'Get started by creating your first task using the form above.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || memberFilter !== 'all') ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setMemberFilter('all');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              ) : (
                <button
                  onClick={handleResetSampleData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample FYP Tasks</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredTasks.map((task) => {
                const complete = isTaskCompleted(task);
                const memberTotal = task.members.length;
                const memberDoneCount = task.members.filter((m) => m.completed).length;

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-xs p-4 sm:p-5 ${
                      complete
                        ? 'border-purple-200/90 bg-purple-50/20'
                        : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    {/* Task Header: Title & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-base font-semibold leading-snug ${
                              complete ? 'text-slate-800 line-through decoration-purple-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            {new Date(task.date + 'T00:00:00').toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            {memberDoneCount} of {memberTotal} completed
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {/* Overall Task Status Badge */}
                        {complete ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Fully Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress ({memberDoneCount}/{memberTotal})</span>
                          </span>
                        )}

                        {/* Quick Mark All or Unmark All button */}
                        <button
                          type="button"
                          onClick={() => markAllInTask(task.id, !complete)}
                          className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors cursor-pointer hidden md:inline-block"
                          title={complete ? 'Unmark all members' : 'Mark all members finished'}
                        >
                          {complete ? 'Uncheck All' : 'Check All'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTaskId(task.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar within Task */}
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          complete ? 'bg-purple-600' : 'bg-purple-400'
                        }`}
                        style={{
                          width: `${memberTotal > 0 ? (memberDoneCount / memberTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    {/* Member Checklists */}
                    <div className="mt-3.5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Assigned Member Checklist:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {task.members.map((assignment) => {
                          const isChecked = assignment.completed;
                          return (
                            <label
                              key={assignment.memberId}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs sm:text-sm cursor-pointer select-none transition-colors ${
                                isChecked
                                  ? 'bg-purple-50/70 border-purple-200 text-purple-950 font-medium'
                                  : 'bg-white border-slate-200 hover:border-purple-200 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  toggleMemberTaskCheckbox(task.id, assignment.memberId)
                                }
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 accent-purple-600 cursor-pointer shrink-0"
                              />
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-3xs font-bold border shrink-0 ${getAvatarBg(
                                  assignment.memberName
                                )}`}
                              >
                                {getInitials(assignment.memberName)}
                              </span>
                              <span
                                className={`truncate flex-1 ${
                                  isChecked ? 'line-through text-purple-900/80' : ''
                                }`}
                              >
                                {assignment.memberName}
                              </span>
                              {isChecked && (
                                <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mr-1" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Footer Controls / Reset */}
        <section className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Click any team member's checkbox to instantly update progress.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetSampleData}
              className="text-purple-600 hover:text-purple-800 underline underline-offset-2 cursor-pointer"
            >
              Reset to Sample Tasks
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all tasks?')) {
                  setTasks([]);
                }
              }}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              Clear All Tasks
            </button>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTaskId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Task</h3>
            </div>
            <p className="text-xs text-slate-600 mt-2 mb-4">
              Are you sure you want to remove this task? This action will permanently remove it from your local storage.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTaskId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(deleteConfirmTaskId)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Team Members Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">FYP Team Members</h3>
                  <p className="text-2xs text-slate-500">Add or edit members in your project team</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMemberModalOpen(false);
                  setEditingMemberId(null);
                  setMemberError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Add New Member
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Usman Ali or Dr. Supervisor"
                  value={newMemberName}
                  onChange={(e) => {
                    setNewMemberName(e.target.value);
                    if (memberError) setMemberError('');
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
              {memberError && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {memberError}
                </p>
              )}
            </form>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Current Members ({members.length})
              </p>
              {members.map((member) => {
                const isEditing = editingMemberId === member.id;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-purple-200 bg-slate-50/50 transition-colors gap-2"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingMemberName}
                          onChange={(e) => setEditingMemberName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveMemberEdit(member.id)}
                          className="text-purple-600 hover:text-purple-800 p-1 cursor-pointer"
                          title="Save name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${getAvatarBg(
                              member.name
                            )}`}
                          >
                            {getInitials(member.name)}
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                            {member.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditingMemberName(member.name);
                              setMemberError('');
                            }}
                            className="text-slate-400 hover:text-purple-600 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Edit member name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMembers(DEFAULT_MEMBERS);
                  setMemberError('');
                }}
                className="text-2xs text-slate-500 hover:text-purple-700 underline cursor-pointer"
              >
                Reset to default members
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMemberModalOpen(false);
                  setEditingMemberId(null);
                  setMemberError('');
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
