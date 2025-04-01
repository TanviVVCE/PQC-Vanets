# Step 1: Add modules to provide access to specific libraries and functions
import os # Module provides functions to handle file paths, directories, environment variables
import sys # Module provides access to Python-specific system parameters and functions
sys.path.append("/Library/Frameworks/Python.framework/Versions/3.13/lib/python3.13/site-packages")
import traci # Static network information (such as reading and analyzing network files)
# Step 2: Establish path to SUMO (SUMO_HOME)
if 'SUMO_HOME' in os.environ:
    tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
    sys.path.append(tools)
else:
    sys.exit("Please declare environment variable 'SUMO_HOME'")

# Step 3: Add Traci module to provide access to specific libraries and functions

# Step 4: Define Sumo configuration
Sumo_config = [
    'sumo-gui',
    '-c', 'VANETs/veins/veins/examples/veins/erlangen.sumo.cfg',
    '--step-length', '0.05',
    '--delay', '1000',
    '--lateral-resolution', '0.1'
]

# Step 5: Open connection between SUMO and Traci
traci.start(Sumo_config)

# Step 6: Define Variables
vehicle_speed = 0
total_speed = 0

# Step 7: Define Functions

# Step 8: Take simulation steps until there are no more vehicles in the network
while traci.simulation.getMinExpectedNumber() > 0:
    traci.simulationStep() # Move simulation forward 1 step
    # Here you can decide what to do with simulation data at each step
    # if 'veh1' in traci.vehicle.getIDList():
    #     vehicle_speed = traci.vehicle.getSpeed('veh1')
    #     total_speed = total_speed + vehicle_speed
    # step_count = step_count + 1
    # print(f"Vehicle speed: {vehicle_speed} m/s")
    # print(traci.vehicle.getIDList());
    print(f"Vehicle speed: {traci.vehicle.getIDList()} m/s")

# Step 9: Close connection between SUMO and Traci
traci.close()