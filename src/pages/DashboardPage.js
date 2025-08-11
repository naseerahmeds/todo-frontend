import React, { useEffect, useState } from "react";
import api from "../api";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import TaskForm from "../components/TaskForm";

function DashboardPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();

    const socket = io("http://localhost:5000");

    socket.on("taskCreated", (task) => {
      setTasks((prev) => [task, ...prev]);
      toast.info("New task created");
    });

    socket.on("taskUpdated", (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
      toast.info("Task updated");
    });

    socket.on("taskDeleted", ({ id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.info("Task deleted");
    });

    return () => socket.disconnect();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      toast.error("Error loading tasks");
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleToggleStatus = async (task) => {
    const updated = {
      ...task,
      status: task.status === "Completed" ? "To-Do" : "Completed"
    };
    try {
      const res = await api.put(`/tasks/${task._id}`, updated);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data : t)));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Your Tasks</h2>
      <TaskForm onTaskCreated={handleTaskCreated} />
      <ul>
        {tasks.map((task) => (
          <li key={task._id} style={{ marginBottom: "0.5rem" }}>
            <strong>{task.title}</strong> - {task.status}
            <button
              onClick={() => handleToggleStatus(task)}
              style={{ marginLeft: "0.5rem" }}
            >
              {task.status === "completed" ? "Mark as Incomplete" : "Mark Completed"}
            </button>
            <button
              onClick={() => handleDelete(task._id)}
              style={{ marginLeft: "0.5rem" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardPage;
