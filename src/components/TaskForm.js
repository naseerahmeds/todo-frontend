import React, { useState } from "react";
import api from "../api";
import { toast } from "react-toastify";

function TaskForm({ onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      const res = await api.post("/tasks", {
        title,
        dueDate,
        status: "To-Do",
        priority: "normal"
      });
      onTaskCreated(res.data);
      setTitle("");
      setDueDate("");
      toast.success("Task created");
    } catch (err) {
      toast.error("Create failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginRight: "0.5rem" }}
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        style={{ marginRight: "0.5rem" }}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

export default TaskForm;
