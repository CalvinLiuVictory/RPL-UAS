export const monthlyActivity = [
  { month: 'Jan', created: 38, resolved: 30 }, { month: 'Feb', created: 44, resolved: 37 }, { month: 'Mar', created: 39, resolved: 35 },
  { month: 'Apr', created: 52, resolved: 42 }, { month: 'May', created: 48, resolved: 45 }, { month: 'Jun', created: 61, resolved: 48 },
  { month: 'Jul', created: 55, resolved: 51 }, { month: 'Aug', created: 68, resolved: 57 }, { month: 'Sep', created: 59, resolved: 54 },
  { month: 'Oct', created: 72, resolved: 63 }, { month: 'Nov', created: 66, resolved: 60 }, { month: 'Dec', created: 78, resolved: 68 },
]

export const complaints = [
  { id: 'SR-2408', title: 'Air conditioning not cooling', building: 'Science Hall', room: 'Room 204', location: 'Science Hall · Room 204', reporter: 'Jordan Lee', assignee: 'Alex Rivera', priority: 'High', status: 'In progress', updated: '12 min ago' },
  { id: 'SR-2407', title: 'Projector connection issue', building: 'Library', room: 'Study 3B', location: 'Library · Study 3B', reporter: 'Morgan Chen', assignee: 'Alex Rivera', priority: 'Normal', status: 'Assigned', updated: '38 min ago' },
  { id: 'SR-2406', title: 'Leaking faucet in washroom', building: 'West Hall', room: 'Floor 2', location: 'West Hall · Floor 2', reporter: 'Sam Patel', assignee: 'Alex Rivera', priority: 'Urgent', status: 'Open', updated: '1 hr ago' },
  { id: 'SR-2405', title: 'Flickering lights in lecture room', building: 'Arts Center', room: 'Room 108', location: 'Arts Center · Room 108', reporter: 'Taylor Kim', assignee: 'Alex Rivera', priority: 'Normal', status: 'Open', updated: '2 hrs ago' },
  { id: 'SR-2404', title: 'Door lock needs adjustment', building: 'Science Hall', room: 'Lab 2.14', location: 'Science Hall · Lab 2.14', reporter: 'Jamie Wilson', assignee: 'Alex Rivera', priority: 'Low', status: 'Resolved', updated: 'Yesterday' },
  { id: 'SR-2403', title: 'Broken desk chair', building: 'East Hall', room: 'Room 301', location: 'East Hall · Room 301', reporter: 'Alex Kim', assignee: 'Alex Rivera', priority: 'Low', status: 'Completed', updated: 'Yesterday' },
  { id: 'SR-2402', title: 'Classroom light repaired', building: 'Arts Center', room: 'Room 108', location: 'Arts Center · Room 108', reporter: 'Jordan Lee', assignee: 'Alex Rivera', priority: 'Low', status: 'Resolved', updated: 'Sep 22' },
]

export const serviceTasks = [
  { id: 'ST-0831', title: 'Inspect air conditioning unit', location: 'Science Hall · Room 204', assignee: 'Alex Rivera', due: 'Today', priority: 'High', status: 'In progress', updated: '12 min ago' },
  { id: 'ST-0830', title: 'Check projector connection', location: 'Library · Study 3B', assignee: 'Alex Rivera', due: 'Today', priority: 'Normal', status: 'Assigned', updated: '38 min ago' },
  { id: 'ST-0829', title: 'Replace hallway light fixture', location: 'Arts Center · Floor 1', assignee: 'Alex Rivera', due: 'Today', priority: 'Normal', status: 'Open', updated: '1 hr ago' },
  { id: 'ST-0828', title: 'Adjust laboratory door lock', location: 'Science Hall · Lab 2.14', assignee: 'Alex Rivera', due: 'Sep 30', priority: 'Low', status: 'Completed', updated: 'Yesterday' },
  { id: 'ST-0827', title: 'Repair water fountain', location: 'East Hall · Lobby', assignee: 'Alex Rivera', due: 'Oct 1', priority: 'Normal', status: 'In progress', updated: 'Yesterday' },
]

export const maintenanceTasks = [
  { id: 'PM-0514', title: 'Quarterly HVAC filter replacement', location: 'Science Hall · Floor 2', assignee: 'Alex Rivera', due: 'Today', priority: 'Normal', status: 'In progress', updated: 'Today' },
  { id: 'PM-0513', title: 'Fire extinguisher inspection', location: 'Library · All floors', assignee: 'Alex Rivera', due: 'Sep 30', priority: 'High', status: 'Scheduled', updated: 'Sep 26' },
  { id: 'PM-0512', title: 'Emergency lighting test', location: 'West Hall · Floor 1', assignee: 'Alex Rivera', due: 'Oct 2', priority: 'Normal', status: 'Open', updated: 'Sep 25' },
  { id: 'PM-0511', title: 'Water heater annual service', location: 'East Hall · Basement', assignee: 'Alex Rivera', due: 'Oct 4', priority: 'Low', status: 'Scheduled', updated: 'Sep 24' },
]

export const users = [
  { id: 'USR-001', name: 'Avery Morgan', email: 'avery.morgan@north.edu', department: 'Facilities', role: 'Administrator', status: 'Active' },
  { id: 'USR-002', name: 'Alex Rivera', email: 'alex.rivera@north.edu', department: 'Campus operations', role: 'Technician', status: 'Active' },
  { id: 'USR-003', name: 'Jordan Lee', email: 'jordan.lee@north.edu', department: 'Biology', role: 'Reporter', status: 'Active' },
  { id: 'USR-004', name: 'Morgan Chen', email: 'morgan.chen@north.edu', department: 'Library services', role: 'Reporter', status: 'Active' },
  { id: 'USR-005', name: 'Sam Patel', email: 'sam.patel@north.edu', department: 'Student services', role: 'Reporter', status: 'Active' },
]

export const buildings = [
  { id: 'BLD-01', name: 'Science Hall', code: 'SCI', location: 'North quad', rooms: 42, status: 'Online' },
  { id: 'BLD-02', name: 'Main Library', code: 'LIB', location: 'Central campus', rooms: 68, status: 'Online' },
  { id: 'BLD-03', name: 'Arts Center', code: 'ART', location: 'West quad', rooms: 31, status: 'Online' },
  { id: 'BLD-04', name: 'West Hall', code: 'WST', location: 'West campus', rooms: 24, status: 'Maintenance' },
  { id: 'BLD-05', name: 'East Residence', code: 'EST', location: 'East campus', rooms: 56, status: 'Online' },
]

export const rooms = [
  { id: 'RM-204', name: 'Room 204', building: 'Science Hall', floor: '2nd floor', type: 'Lecture room', devices: 4, status: 'Active' },
  { id: 'RM-214', name: 'Lab 2.14', building: 'Science Hall', floor: '2nd floor', type: 'Laboratory', devices: 9, status: 'Active' },
  { id: 'RM-3B', name: 'Study 3B', building: 'Main Library', floor: '3rd floor', type: 'Study room', devices: 2, status: 'Active' },
  { id: 'RM-108', name: 'Room 108', building: 'Arts Center', floor: '1st floor', type: 'Studio', devices: 3, status: 'Active' },
  { id: 'RM-301', name: 'Room 301', building: 'East Residence', floor: '3rd floor', type: 'Common room', devices: 1, status: 'Active' },
]

export const devices = [
  { id: 'DEV-204-09', name: 'Air handling unit AHU-204', category: 'HVAC', building: 'Science Hall', room: 'Room 204', condition: 'Needs repair', status: 'Active' },
  { id: 'DEV-3B-02', name: 'Epson projector EB-735', category: 'AV equipment', building: 'Main Library', room: 'Study 3B', condition: 'Good', status: 'Active' },
  { id: 'DEV-108-04', name: 'LED panel light LP-108', category: 'Electrical', building: 'Arts Center', room: 'Room 108', condition: 'Needs repair', status: 'Active' },
  { id: 'DEV-LAB-12', name: 'Lab safety cabinet SC-12', category: 'Safety', building: 'Science Hall', room: 'Lab 2.14', condition: 'Good', status: 'Active' },
  { id: 'DEV-EH-01', name: 'Water fountain WF-01', category: 'Plumbing', building: 'East Residence', room: 'Lobby', condition: 'Needs service', status: 'Inactive' },
]