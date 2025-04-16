import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Edit, Trash, Plus, Calendar, Link2, ImagePlus, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Event {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
  priority: number;
  featured: boolean;
  displayOnDashboard: boolean;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  priority: number;
  featured: boolean;
  displayOnDashboard: boolean;
}

export default function EventsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    imageUrl: "",
    linkUrl: "",
    active: true,
    priority: 1,
    featured: false,
    displayOnDashboard: true
  });

  // Fetch all events
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const res = await fetch('/api/events');
      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }
      return res.json() as Promise<Event[]>;
    }
  });

  // Create new event
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: Partial<Event>) => {
      const res = await apiRequest('POST', '/api/events', newEvent);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update existing event
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Event> }) => {
      const res = await apiRequest('PATCH', `/api/events/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete event
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for API
    const eventData = {
      ...formData,
      priority: Number(formData.priority),
    };
    
    if (selectedEvent) {
      // Update existing event
      updateEventMutation.mutate({ id: selectedEvent.id, data: eventData });
    } else {
      // Create new event
      createEventMutation.mutate(eventData);
    }
  };
  
  const handleUploadImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Handle file upload logic here
    // For now, we'll just set a placeholder URL
    toast({
      title: "Image upload",
      description: "Image upload functionality will be implemented soon.",
    });
  };
  
  const toggleEventActive = (event: Event) => {
    updateEventMutation.mutate({
      id: event.id,
      data: { active: !event.active }
    });
  };
  
  const toggleEventFeatured = (event: Event) => {
    updateEventMutation.mutate({
      id: event.id,
      data: { featured: !event.featured }
    });
  };
  
  const toggleEventDashboard = (event: Event) => {
    updateEventMutation.mutate({
      id: event.id,
      data: { displayOnDashboard: !event.displayOnDashboard }
    });
  };
  
  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      imageUrl: event.imageUrl || "",
      linkUrl: event.linkUrl || "",
      active: event.active,
      priority: event.priority,
      featured: event.featured,
      displayOnDashboard: event.displayOnDashboard
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      imageUrl: "",
      linkUrl: "",
      active: true,
      priority: 1,
      featured: false,
      displayOnDashboard: true
    });
    setSelectedEvent(null);
  };

  // Filter events by active status
  const activeEvents = events.filter(event => event.active);
  const inactiveEvents = events.filter(event => !event.active);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Management</h2>
          <p className="text-muted-foreground">
            Create and manage special events and countdowns shown on the dashboard
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new event to display on the platform. Events can feature countdowns, promotional content, and links.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="imageUrl" className="text-right">
                    Image URL
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      size="icon"
                      onClick={handleUploadImageClick}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="linkUrl" className="text-right">
                    Link URL
                  </Label>
                  <Input
                    id="linkUrl"
                    name="linkUrl"
                    value={formData.linkUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/page"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Input
                    id="priority"
                    name="priority"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    Settings
                  </div>
                  <div className="col-span-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="active" 
                        checked={formData.active}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange("active", checked === true)
                        }
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="featured" 
                        checked={formData.featured}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange("featured", checked === true)
                        }
                      />
                      <Label htmlFor="featured">Featured</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="displayOnDashboard" 
                        checked={formData.displayOnDashboard}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange("displayOnDashboard", checked === true)
                        }
                      />
                      <Label htmlFor="displayOnDashboard">Display on dashboard</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active Events ({activeEvents.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive Events ({inactiveEvents.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <EventsTable 
            events={activeEvents} 
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onToggleActive={toggleEventActive}
            onToggleFeatured={toggleEventFeatured}
            onToggleDashboard={toggleEventDashboard}
          />
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          <EventsTable 
            events={inactiveEvents} 
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            onToggleActive={toggleEventActive}
            onToggleFeatured={toggleEventFeatured}
            onToggleDashboard={toggleEventDashboard}
          />
        </TabsContent>
      </Tabs>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Make changes to the event details below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="edit-startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="edit-endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-imageUrl" className="text-right">
                  Image URL
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="edit-imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    size="icon"
                    onClick={handleUploadImageClick}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-linkUrl" className="text-right">
                  Link URL
                </Label>
                <Input
                  id="edit-linkUrl"
                  name="linkUrl"
                  value={formData.linkUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/page"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-priority" className="text-right">
                  Priority
                </Label>
                <Input
                  id="edit-priority"
                  name="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right">
                  Settings
                </div>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-active" 
                      checked={formData.active}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange("active", checked === true)
                      }
                    />
                    <Label htmlFor="edit-active">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-featured" 
                      checked={formData.featured}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange("featured", checked === true)
                      }
                    />
                    <Label htmlFor="edit-featured">Featured</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-displayOnDashboard" 
                      checked={formData.displayOnDashboard}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange("displayOnDashboard", checked === true)
                      }
                    />
                    <Label htmlFor="edit-displayOnDashboard">Display on dashboard</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (
              <p className="font-medium">{selectedEvent.title}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={() => selectedEvent && deleteEventMutation.mutate(selectedEvent.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventsTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onToggleActive: (event: Event) => void;
  onToggleFeatured: (event: Event) => void;
  onToggleDashboard: (event: Event) => void;
}

function EventsTable({ 
  events, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onToggleFeatured,
  onToggleDashboard
}: EventsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No events found
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {event.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-muted-foreground">
                      Start: {format(parseISO(event.startDate), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      End: {format(parseISO(event.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{event.priority}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {event.active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                        Inactive
                      </Badge>
                    )}
                    
                    {event.featured && (
                      <Badge className="bg-amber-500">Featured</Badge>
                    )}
                    
                    {event.displayOnDashboard && (
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Dashboard
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(event)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleActive(event)}>
                        {event.active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleFeatured(event)}>
                        {event.featured ? "Unmark Featured" : "Mark as Featured"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleDashboard(event)}>
                        {event.displayOnDashboard ? "Remove from Dashboard" : "Add to Dashboard"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDelete(event)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}