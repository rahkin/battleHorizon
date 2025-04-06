import bpy
import math
import random

def create_building(x, y, width, depth, height, has_interior=False):
    # Create building base
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, height/2))
    building = bpy.context.active_object
    building.scale = (width, depth, height)
    building.name = f"Building_{x}_{y}"
    
    # Add windows
    if has_interior:
        # Create interior space
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, height/2))
        interior = bpy.context.active_object
        interior.scale = (width-0.2, depth-0.2, height-0.2)
        interior.name = f"Interior_{x}_{y}"
        
        # Create entrance
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y-depth/2, 1))
        entrance = bpy.context.active_object
        entrance.scale = (width/3, 0.1, 2)
        entrance.name = f"Entrance_{x}_{y}"

def create_road(x, y, length, width, is_horizontal=True):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.1))
    road = bpy.context.active_object
    if is_horizontal:
        road.scale = (length, width, 0.2)
    else:
        road.scale = (width, length, 0.2)
    road.name = f"Road_{x}_{y}"

def create_city():
    # Clear existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Create ground plane
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    
    # Create main roads
    create_road(0, 0, 100, 8, True)  # Main horizontal road
    create_road(0, 0, 100, 8, False)  # Main vertical road
    
    # Create buildings
    building_positions = []
    for i in range(-40, 41, 20):
        for j in range(-40, 41, 20):
            if abs(i) > 10 or abs(j) > 10:  # Leave space around center
                height = random.uniform(10, 30)
                has_interior = random.random() > 0.7  # 30% chance of having interior
                create_building(i, j, 8, 8, height, has_interior)
                building_positions.append((i, j))
    
    # Create some smaller buildings in alleys
    for i in range(-35, 36, 10):
        for j in range(-35, 36, 10):
            if (i, j) not in building_positions:
                height = random.uniform(5, 15)
                create_building(i, j, 4, 4, height, random.random() > 0.8)

if __name__ == "__main__":
    create_city() 