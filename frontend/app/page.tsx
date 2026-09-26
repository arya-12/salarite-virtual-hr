"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
};

type Interview = {
  id: number;
  candidate_name: string;
  scheduled_at: string;
  mode: string;
  status: string;
};

type Toast = { id: number; message: string };

const TASK_STATUSES = ["Pending", "In Progress", "Completed"] as const;

function statusAccent(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "border-l-emerald-600 dark:border-l-emerald-500";
    case "in progress":
      return "border-l-teal-600 dark:border-l-teal-500";
    default:
      return "border-l-amber-600 dark:border-l-amber-500";
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dark, setDark] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [candidateName, setCandidateName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState("Video");

  // ---- theme: load saved preference, respect system as fallback ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem("salarite-theme");
      if (saved) {
        setDark(saved === "dark");
      } else {
        setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    } catch {
      /* localStorage unavailable — default to light */
    }
  }, []);

  // ---- apply the class to <html> directly so it reliably wins over any
  //      other global dark-mode CSS, and toggles cleanly both ways ----
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("salarite-theme", next ? "dark" : "light");
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  const notify = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  // =========================
  // LOAD TASKS + INTERVIEWS
  // =========================
  const loadData = async () => {
    try {
      const [tasksResponse, interviewsResponse] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/interviews`),
      ]);

      if (!tasksResponse.ok || !interviewsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      setTasks(await tasksResponse.json());
      setInterviews(await interviewsResponse.json());
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // CREATE TASK
  // =========================
  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      notify("Please enter a task title");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          assigned_to: assignedTo.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      setTitle("");
      setDescription("");
      setAssignedTo("");
      await loadData();
      notify("Task assigned");
    } catch (error) {
      console.error("Task creation error:", error);
      notify("Failed to create task");
    }
  };

  // =========================
  // UPDATE TASK STATUS
  // =========================
  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      await loadData();
      notify("Task status updated");
    } catch (error) {
      console.error("Status update error:", error);
      notify("Failed to update task status");
    }
  };

  // =========================
  // CREATE INTERVIEW
  // =========================
  const createInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const candidate = candidateName.trim();
    const dateTime = scheduledAt.trim();

    if (!candidate) {
      notify("Please enter candidate name");
      return;
    }
    if (!dateTime) {
      notify("Please select interview date and time");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_name: candidate,
          scheduled_at: dateTime,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        notify("Failed to schedule interview");
        return;
      }

      notify("Interview scheduled");
      setCandidateName("");
      setScheduledAt("");
      setMode("Video");
      await loadData();
    } catch (error) {
      console.error("Interview error:", error);
      notify("Could not connect to backend. Make sure FastAPI is running.");
    }
  };

  const completedCount = tasks.filter(
    (t) => t.status.toLowerCase() === "completed"
  ).length;

  const columns = TASK_STATUSES.map((status) => ({
    status,
    items: tasks.filter(
      (t) => t.status.trim().toLowerCase() === status.toLowerCase()
    ),
  }));

  return (
    <>
      <main className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-[#0B0E13] dark:text-slate-100">
        {/* ================= HEADER BAND ================= */}
        <div className="border-b border-white/5 bg-[#14181f] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-6 py-9">
            <div>
              <p className="mb-1 text-xs tracking-wide text-slate-400">Employer console</p>
              <h1 className="font-serif text-3xl font-semibold">Salarite Virtual HR</h1>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Assign work to your virtual HR desk and keep candidate interviews on schedule, in one board.
              </p>
              {lastSynced && (
                <p className="mt-3 text-xs text-slate-500">
                  Synced {lastSynced.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex divide-x divide-slate-700">
                <div className="px-5">
                  <p className="font-serif text-3xl leading-none">{tasks.length}</p>
                  <p className="mt-1.5 text-xs text-slate-400">Total tasks</p>
                </div>
                <div className="px-5">
                  <p className="font-serif text-3xl leading-none text-amber-400">{completedCount}</p>
                  <p className="mt-1.5 text-xs text-slate-400">Completed</p>
                </div>
                <div className="px-5">
                  <p className="font-serif text-3xl leading-none text-teal-400">{interviews.length}</p>
                  <p className="mt-1.5 text-xs text-slate-400">Interviews scheduled</p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                aria-pressed={dark}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:border-slate-400 hover:text-white"
              >
                {dark ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                    <circle cx="12" cy="12" r="4.5" />
                    <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-16">
          {/* ================= FORMS ================= */}
          <div className="-mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-[#171d25]">
              <h2 className="mb-4 border-b border-amber-600/70 pb-3 font-serif text-lg font-medium dark:border-amber-500/60">
                Assign a task
              </h2>
              <form onSubmit={createTask} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Review candidate resumes"
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100 dark:focus:border-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Shortlist top 5 for the design role"
                    rows={3}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100 dark:focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Assign to</label>
                  <input
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Virtual HR"
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100 dark:focus:border-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.99]"
                >
                  Assign task
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-[#171d25]">
              <h2 className="mb-4 border-b border-teal-600/70 pb-3 font-serif text-lg font-medium dark:border-teal-500/60">
                Schedule an interview
              </h2>
              <form onSubmit={createInterview} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Candidate name</label>
                  <input
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100 dark:focus:border-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Date &amp; time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100 dark:focus:border-slate-500 dark:[color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100"
                  >
                    <option value="Video">Video</option>
                    <option value="Voice">Voice</option>
                    <option value="Chat">Chat</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.99]"
                >
                  Schedule interview
                </button>
              </form>
            </section>
          </div>

          {/* ================= TASK BOARD (kanban) ================= */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-medium">Task board</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">{tasks.length} total</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {columns.map((col) => (
                <div
                  key={col.status}
                  className="rounded-lg border border-slate-200 bg-white p-3.5 transition-colors dark:border-slate-800 dark:bg-[#171d25]"
                >
                  <div className="mb-2.5 flex justify-between border-b border-dashed border-slate-200 pb-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <span>{col.status}</span>
                    <span>{col.items.length}</span>
                  </div>

                  {col.items.length === 0 ? (
                    <p className="p-1 text-sm text-slate-400 dark:text-slate-500">Nothing here.</p>
                  ) : (
                    col.items.map((task) => (
                      <div
                        key={task.id}
                        className={`mb-2.5 rounded-md border-l-[3px] bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-[#10141a] dark:hover:bg-[#161c24] ${statusAccent(task.status)}`}
                      >
                        <h3 className="text-sm font-semibold">{task.title}</h3>
                        {task.description && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
                        )}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {task.assigned_to || "Virtual HR"}
                          </span>
                          <select
                            value={task.status}
                            onChange={(e) => updateStatus(task.id, e.target.value)}
                            className="rounded border border-slate-300 bg-white p-1 text-xs dark:border-slate-700 dark:bg-[#10141a] dark:text-slate-100"
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ================= INTERVIEW TIMELINE ================= */}
          <section className="mt-10">
            <h2 className="mb-4 font-serif text-xl font-medium">Upcoming interviews</h2>
            <div className="rounded-lg border border-slate-200 bg-white p-6 transition-colors dark:border-slate-800 dark:bg-[#171d25]">
              {sortedInterviews.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">No interviews scheduled yet.</p>
              ) : (
                <div className="ml-1.5 space-y-6 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
                  {sortedInterviews.map((interview) => (
                    <div key={interview.id} className="relative">
                      <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600 dark:bg-teal-500" />
                      <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {new Date(interview.scheduled_at).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold">{interview.candidate_name}</h3>
                      <div className="mt-1.5 flex gap-2">
                        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                          {interview.mode}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {interview.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ================= TOASTS ================= */}
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="rounded-md bg-[#14181f] px-5 py-2.5 text-sm text-white shadow-lg dark:bg-slate-800"
            >
              {t.message}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}