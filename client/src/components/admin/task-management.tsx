import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { CalendarIcon, MoreHorizontal, Edit, Trash, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  role: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: number | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: number;
  assignee?: User | null;
  creator?: User | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-blue-100 text-blue-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "urgent":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function TaskManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAssigned, setFilterAssigned] = useState<boolean>(false);
  const [filterCreated, setFilterCreated] = useState<boolean>(false);
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: null as number | null,
    status: "pending",
    priority: "medium",
    dueDate: null as string | null,
  });

  const [editTask, setEditTask] = useState({
    id: 0,
    title: "",
    description: "",
    assignedTo: null as number | null,
    status: "pending",
    priority: "medium",
    dueDate: null as string | null,
  });

  // Fetch all tasks
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["/api/admin/tasks"],
    queryFn: async () => {
      const statusParam = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/admin/tasks${statusParam}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    }
  });

  // Fetch all users for assignment dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    enabled: user?.role === "admin"
  });

  // Filter tasks based on current selections
  const filteredTasks = tasks.filter((task: Task) => {
    // Filter by status if selected
    if (filterStatus && task.status !== filterStatus) {
      return false;
    }
    
    // Filter tasks assigned to current user if selected
    if (filterAssigned && task.assignedTo !== user?.id) {
      return false;
    }
    
    // Filter tasks created by current user if selected
    if (filterCreated && task.createdBy !== user?.id) {
      return false;
    }
    
    return true;
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      const res = await apiRequest("POST", "/api/admin/tasks", taskData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task created",
        description: "New task has been created successfully",
      });
      setIsCreateDialogOpen(false);
      resetNewTask();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: typeof editTask) => {
      const { id, ...data } = taskData;
      const res = await apiRequest("PATCH", `/api/admin/tasks/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/admin/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function resetNewTask() {
    setNewTask({
      title: "",
      description: "",
      assignedTo: null,
      status: "pending",
      priority: "medium",
      dueDate: null,
    });
  }

  function handleCreateTask() {
    createTaskMutation.mutate({
      ...newTask,
      // Add createdBy in the API route
    });
  }

  function handleUpdateTask() {
    if (!selectedTask) return;
    
    updateTaskMutation.mutate(editTask);
  }

  function handleDeleteTask() {
    if (!selectedTask) return;
    
    deleteTaskMutation.mutate(selectedTask.id);
  }

  function openViewTask(task: Task) {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  }

  function openEditTask(task: Task) {
    setSelectedTask(task);
    setEditTask({
      id: task.id,
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    setIsEditDialogOpen(true);
  }

  function openDeleteTask(task: Task) {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  }

  // Effect to reset filters when component remounts
  useEffect(() => {
    // Reset filters
    setFilterStatus(null);
    setFilterAssigned(false);
    setFilterCreated(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Management</h2>
        {user?.role === "admin" && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create Task</Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 my-4 items-center">
        <div className="flex items-center space-x-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select 
            value={filterStatus || "all"} 
            onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[150px]" id="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="assigned-filter" 
            checked={filterAssigned}
            onCheckedChange={(checked) => setFilterAssigned(checked as boolean)} 
          />
          <Label htmlFor="assigned-filter">Assigned to me</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="created-filter" 
            checked={filterCreated}
            onCheckedChange={(checked) => setFilterCreated(checked as boolean)} 
          />
          <Label htmlFor="created-filter">Created by me</Label>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setFilterStatus(null);
            setFilterAssigned(false);
            setFilterCreated(false);
          }}
        >
          Clear Filters
        </Button>
      </div>

      {tasksLoading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No tasks found</h3>
          <p className="text-sm text-muted-foreground">
            {filterStatus || filterAssigned || filterCreated
              ? "Try adjusting your filters"
              : "Create a new task to get started"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task: Task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {task.assignee ? task.assignee.username : "Unassigned"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {task.dueDate ? format(new Date(task.dueDate), "PP") : "No deadline"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openViewTask(task)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditTask(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Task
                        </DropdownMenuItem>
                        {user?.role === "admin" && (
                          <DropdownMenuItem 
                            onClick={() => openDeleteTask(task)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Task
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assign to</Label>
                <Select
                  value={newTask.assignedTo ? String(newTask.assignedTo) : "unassigned"}
                  onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value === "unassigned" ? null : parseInt(value) })}
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.username} {user.role === "admin" ? "(Admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !newTask.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? format(new Date(newTask.dueDate), "PPP") : "No deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTask.dueDate ? new Date(newTask.dueDate) : undefined}
                    onSelect={(date) => setNewTask({ ...newTask, dueDate: date ? date.toISOString() : null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetNewTask();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!newTask.title || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details and assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editTask.status}
                  onValueChange={(value) => setEditTask({ ...editTask, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editTask.priority}
                  onValueChange={(value) => setEditTask({ ...editTask, priority: value })}
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {user?.role === "admin" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-assignee">Assign to</Label>
                <Select
                  value={editTask.assignedTo ? String(editTask.assignedTo) : "unassigned"}
                  onValueChange={(value) => setEditTask({ ...editTask, assignedTo: value === "unassigned" ? null : parseInt(value) })}
                >
                  <SelectTrigger id="edit-assignee">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.username} {user.role === "admin" ? "(Admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !editTask.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editTask.dueDate ? format(new Date(editTask.dueDate), "PPP") : "No deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editTask.dueDate ? new Date(editTask.dueDate) : undefined}
                    onSelect={(date) => setEditTask({ ...editTask, dueDate: date ? date.toISOString() : null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTask}
              disabled={!editTask.title || updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="mt-1">{selectedTask?.description || "No description provided."}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Status</h4>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${selectedTask ? getStatusColor(selectedTask.status) : ""}`}>
                  {selectedTask && selectedTask.status ? 
                    selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1) : 
                    "Unknown"}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium">Priority</h4>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${selectedTask ? getPriorityColor(selectedTask.priority) : ""}`}>
                  {selectedTask && selectedTask.priority ? 
                    selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1) : 
                    "Medium"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Assigned To</h4>
                <p className="mt-1">{selectedTask?.assignee ? selectedTask.assignee.username : "Unassigned"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Created By</h4>
                <p className="mt-1">{selectedTask?.creator ? selectedTask.creator.username : "Unknown"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Due Date</h4>
                <p className="mt-1">
                  {selectedTask?.dueDate 
                    ? format(new Date(selectedTask.dueDate), "PPP") 
                    : "No deadline"
                  }
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Created At</h4>
                <p className="mt-1">{selectedTask?.createdAt && format(new Date(selectedTask.createdAt), "PPP")}</p>
              </div>
            </div>
            
            {selectedTask?.status === "completed" && selectedTask?.completedAt && (
              <div>
                <h4 className="text-sm font-medium">Completed At</h4>
                <p className="mt-1">{format(new Date(selectedTask.completedAt), "PPP")}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                openEditTask(selectedTask!);
              }}
            >
              Edit Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}