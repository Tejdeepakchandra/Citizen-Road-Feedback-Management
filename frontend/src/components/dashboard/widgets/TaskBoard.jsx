import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button,
  useTheme,
} from '@mui/material';
import {
  DragIndicator,
  MoreVert,
  Add,
  Assignment,
  Schedule,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const TaskBoard = () => {
  const [tasks, setTasks] = useState({
    pending: [
      { id: '1', title: 'Pothole repair on Main St', priority: 'high', assignee: 'Unassigned', category: 'pothole' },
      { id: '2', title: 'Street light replacement', priority: 'medium', assignee: 'Staff #2', category: 'lighting' },
      { id: '3', title: 'Drainage cleaning', priority: 'low', assignee: 'Staff #3', category: 'drainage' },
    ],
    inProgress: [
      { id: '4', title: 'Garbage collection', priority: 'medium', assignee: 'Staff #4', category: 'garbage' },
      { id: '5', title: 'Signboard installation', priority: 'low', assignee: 'Staff #5', category: 'signboard' },
    ],
    completed: [
      { id: '6', title: 'Road marking painting', priority: 'high', assignee: 'Staff #1', category: 'road_markings' },
      { id: '7', title: 'Sidewalk repair', priority: 'medium', assignee: 'Staff #2', category: 'sidewalk' },
    ],
  });

  const [newTask, setNewTask] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reorder within same column
      const column = tasks[source.droppableId];
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      
      setTasks({
        ...tasks,
        [source.droppableId]: column,
      });
    } else {
      // Move between columns
      const sourceColumn = tasks[source.droppableId];
      const destColumn = tasks[destination.droppableId];
      const [removed] = sourceColumn.splice(source.index, 1);
      
      // Update task status based on destination column
      const updatedTask = { ...removed };
      
      destColumn.splice(destination.index, 0, updatedTask);
      
      setTasks({
        ...tasks,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn,
      });
    }
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;

    const newTaskObj = {
      id: `task-${Date.now()}`,
      title: newTask,
      priority: 'medium',
      assignee: 'Unassigned',
      category: 'other',
    };

    setTasks({
      ...tasks,
      pending: [...tasks.pending, newTaskObj],
    });

    setNewTask('');
  };

  const columns = [
    { id: 'pending', title: 'Pending', icon: <Pending />, color: theme.palette.warning.main, count: tasks.pending.length },
    { id: 'inProgress', title: 'In Progress', icon: <Schedule />, color: theme.palette.info.main, count: tasks.inProgress.length },
    { id: 'completed', title: 'Completed', icon: <CheckCircle />, color: theme.palette.success.main, count: tasks.completed.length },
  ];

  const getPriorityChip = (priority) => {
    const colors = {
      high: 'error',
      medium: 'warning',
      low: 'success',
    };
    
    const labels = {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    return (
      <Chip
        label={labels[priority]}
        size="small"
        color={colors[priority]}
        sx={{ height: 20, fontSize: '0.65rem' }}
      />
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Task Board
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              sx={{ width: 200 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleAddTask}
            >
              Add
            </Button>
          </Box>
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {columns.map((column) => (
              <Box key={column.id}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: `${column.color}10`,
                    borderRadius: 1,
                    border: `1px solid ${column.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {column.icon}
                    <Typography variant="subtitle1" fontWeight={600}>
                      {column.title}
                    </Typography>
                  </Box>
                  <Chip
                    label={column.count}
                    size="small"
                    sx={{
                      backgroundColor: column.color,
                      color: '#fff',
                    }}
                  />
                </Box>

                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: 200,
                        backgroundColor: theme.palette.background.default,
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      {tasks[column.id].map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                p: 2,
                                mb: 1,
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                cursor: 'grab',
                                '&:hover': {
                                  boxShadow: theme.shadows[2],
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <DragIndicator sx={{ color: 'text.disabled', fontSize: 16 }} />
                                  {getPriorityChip(task.priority)}
                                </Box>
                                <IconButton size="small">
                                  <MoreVert />
                                </IconButton>
                              </Box>
                              
                              <Typography variant="body2" fontWeight={600} gutterBottom>
                                {task.title}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip
                                  label={task.assignee}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  #{task.id}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Box>
            ))}
          </Box>
        </DragDropContext>
      </CardContent>
    </Card>
  );
};

export default TaskBoard;