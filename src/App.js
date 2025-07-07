import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

// IMPORTANT: use your backend URL
const API_URL = "https://todo-backend-tcqv.onrender.com";

const socket = io(API_URL);

function App() {
  const [token, setToken] = useState("");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get("token");
    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
      fetchTasks(t);
    } else {
      const stored = localStorage.getItem("token");
      if (stored) {
        setToken(stored);
        fetchTasks(stored);
      }
    }
  }, []);

  useEffect(() => {
    socket.on("taskCreated", () => {
      if (token) fetchTasks(token);
    });
    socket.on("taskUpdated", () => {
      if (token) fetchTasks(token);
    });
    socket.on("taskDeleted", () => {
      if (token) fetchTasks(token);
    });
    return () => {
      socket.off("taskCreated");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, [token]);

  const fetchTasks = async (jwt) => {
    const res = await axios.get(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setTasks(res.data);
  };

  const addOrUpdateTask = async () => {
    if (!title.trim()) return;
    if (editingTask) {
      await axios.patch(
        `${API_URL}/api/tasks/${editingTask._id}`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTask(null);
    } else {
      await axios.post(
        `${API_URL}/api/tasks`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setTitle("");
    fetchTasks(token);
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `${API_URL}/api/tasks/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks(token);
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API_URL}/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks(token);
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setTitle(task.title);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setTitle("");
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken("");
    window.location.href = "/";
  };

  if (!token) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to ToDo App</h1>
        <a href={`${API_URL}/api/auth/google`}>Sign in with Google</a>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Your Tasks</h1>
      <button onClick={signOut}>Sign Out</button>
      <input
        placeholder="Enter task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={addOrUpdateTask}>
        {editingTask ? "Update Task" : "Add Task"}
      </button>
      {editingTask && <button onClick={cancelEditing}>Cancel</button>}
      <ul>
        {tasks.map((task) => (
          <li key={task._id}>
            <span>{task.title}</span>
            <button
              onClick={() =>
                updateStatus(
                  task._id,
                  task.status === "completed" ? "in progress" : "completed"
                )
              }
            >
              Toggle Status
            </button>
            <button onClick={() => startEditing(task)}>Edit</button>
            <button onClick={() => deleteTask(task._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
