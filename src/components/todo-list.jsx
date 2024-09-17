import { useState } from "react"; // Hook de React para manejar el estado local
import PropTypes from "prop-types"; // Librería para validar los tipos de propiedades del componente
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core"; // Importamos las funcionalidades de arrastrar y soltar
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"; // Contexto y estrategia para listas ordenables
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"; // Modificador para restringir el arrastre al eje vertical
import "./todo-list.css"; // Archivo de estilos CSS para el componente

// Componente para representar cada tarea como un ítem arrastrable
const DraggableItem = ({
  id,
  text,
  completed,
  onToggleComplete,
  onDelete,
  onEdit,
  isEditing,
  onEditMode,
}) => {
  // Configura el ítem como arrastrable
  const { setNodeRef, transform } = useDraggable({
    id,
    disabled: completed || isEditing, // Desactiva el arrastre si la tarea está completada o en modo edición
  });

  // Manejador de clic para los botones de completar y eliminar
  const handleButtonClick = (e) => {
    e.stopPropagation(); // Evita que el clic inicie el arrastre
    if (completed) {
      onDelete(); // Si la tarea está completada, la elimina
    } else {
      onToggleComplete(); // Si no está completada, la marca como completada
    }
  };

  return (
    <div
      ref={setNodeRef} // Referencia para la funcionalidad de arrastre
      className="draggable-item" // Clase de estilo para el ítem
      style={{
        // Aplica la transformación visual durante el arrastre
        transform: `translate3d(${transform ? transform.x : 0}px, ${
          transform ? transform.y : 0
        }px, 0)`,
      }}
    >
      <div className="draggable-content">
        {" "}
        {/* Contenedor para el texto y los botones */}
        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => onEdit(id, e.target.value)} // Actualiza el texto de la tarea al editar
            onBlur={() => onEditMode(null)} // Sale del modo edición cuando pierde el foco
            autoFocus
            className="draggable-input" // Estilo para el campo de texto editable
          />
        ) : (
          <span className="draggable-text">{text}</span> // Muestra el texto de la tarea
        )}
        <div className="buttons-container">
          {" "}
          {/* Contenedor para los botones */}
          <button
            onClick={handleButtonClick}
            className={`toggle-complete ${completed ? "completed" : ""}`} // Estilo cambia si está completada
            draggable={false} // Previene el arrastre del botón
          >
            {completed ? "✖" : "✔"}{" "}
            {/* Muestra ✔ para completar y ✖ para eliminar */}
          </button>
          <button
            onClick={() => onEditMode(id)} // Activa el modo edición
            className="edit-button" // Botón para editar el texto
            draggable={false} // Previene el arrastre del botón
          >
            ✏️ {/* Icono de lápiz para editar */}
          </button>
        </div>
      </div>
    </div>
  );
};

// Definición de los tipos de propiedades esperados para DraggableItem
DraggableItem.propTypes = {
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onEditMode: PropTypes.func.isRequired,
};

// Componente que define un área donde los ítems pueden ser soltados
const DroppableArea = ({ children, id, handleDrop }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef} // Referencia para la funcionalidad de soltado
      onDragOver={(e) => e.preventDefault()} // Evita el comportamiento predeterminado del arrastre
      onDrop={handleDrop} // Manejador al soltar el ítem
      className="droppable-area" // Clase de estilo para la área de soltado
    >
      {children} {/* Renderiza los ítems dropeables */}
    </div>
  );
};

// Definición de los tipos de propiedades esperados para DroppableArea
DroppableArea.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string.isRequired,
  handleDrop: PropTypes.func.isRequired,
};

// Componente principal que maneja la lista de tareas
const TodoList = () => {
  // Estados para las tareas, tareas completadas, nueva tarea y modo de edición
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Función para agregar una nueva tarea
  const handleAddTask = () => {
    if (newTask.trim()) {
      setTodos([
        ...todos,
        { id: `item-${Date.now()}`, text: newTask, completed: false }, // Agrega una nueva tarea con un ID único
      ]);
      setNewTask(""); // Limpia el campo de entrada después de añadir
    }
  };

  // Función que maneja la finalización del arrastre
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return; // Termina si no hay una área válida de soltado

    if (over.id === "completed") {
      // Mueve la tarea a la lista de completadas
      const taskToMove = todos.find((todo) => todo.id === active.id);
      if (taskToMove) {
        setTodos((prevTodos) =>
          prevTodos.filter((todo) => todo.id !== active.id)
        );
        setCompletedTodos((prevCompleted) => [
          ...prevCompleted,
          { ...taskToMove, completed: true },
        ]);
      }
    } else if (over.id === "todos") {
      // Mueve la tarea de vuelta a la lista de pendientes
      const taskToMove = completedTodos.find((todo) => todo.id === active.id);
      if (taskToMove) {
        setCompletedTodos((prevCompleted) =>
          prevCompleted.filter((todo) => todo.id !== active.id)
        );
        setTodos((prevTodos) => [
          ...prevTodos,
          { ...taskToMove, completed: false },
        ]);
      }
    }
  };

  // Función para eliminar una tarea completada
  const handleDeleteTask = (id) => {
    setCompletedTodos((prevCompleted) =>
      prevCompleted.filter((todo) => todo.id !== id)
    );
  };

  // Función para editar el texto de una tarea
  const handleEditTask = (id, newText) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  };

  return (
    <div className="todo-list-container">
      {" "}
      {/* Contenedor principal de la lista de tareas */}
      <div className="content-wrapper">
        <h1>Lista de Tareas</h1> {/* Título de la aplicación */}
        <div className="input-container">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)} // Actualiza el estado del campo de entrada
            placeholder="Add a new task" // Texto de marcador de posición en el campo de entrada
            className="add-task-input" // Clase de estilo para el campo de entrada
          />
          <button onClick={handleAddTask} className="add-task-button">
            Add {/* Botón para añadir una nueva tarea */}
          </button>
        </div>
        {/* Contexto de arrastre y soltado que envuelve las áreas dropeables */}
        <DndContext
          collisionDetection={closestCenter} // Detecta colisiones en el centro del ítem
          onDragEnd={handleDragEnd} // Maneja el evento al finalizar el arrastre
          modifiers={[restrictToVerticalAxis]} // Restringe el arrastre al eje vertical
        >
          {/* Contexto ordenable para las tareas pendientes */}
          <SortableContext items={todos} strategy={sortableKeyboardCoordinates}>
            <DroppableArea id="todos" handleDrop={() => {}}>
              {" "}
              {/* Área donde se pueden soltar tareas pendientes */}
              {todos.map((todo) => (
                <DraggableItem
                  key={todo.id}
                  id={todo.id}
                  text={todo.text}
                  completed={todo.completed}
                  isEditing={editingId === todo.id} // Verifica si el ítem está en modo edición
                  onToggleComplete={() =>
                    handleDragEnd({
                      active: { id: todo.id },
                      over: { id: "completed" },
                    })
                  } // Mueve la tarea a la lista de completadas
                  onDelete={() => {}} // No elimina desde la lista de pendientes
                  onEdit={handleEditTask} // Llama a la función de edición
                  onEditMode={setEditingId} // Activa o desactiva el modo edición
                />
              ))}
            </DroppableArea>
          </SortableContext>
          {/* Lista de Tareas Completadas */}
          <h2 className="completed-title">Tareas Completadas</h2>{" "}
          {/* Título para las tareas completadas */}
          <SortableContext
            items={completedTodos} // Define los ítems que pueden ser ordenados
            strategy={sortableKeyboardCoordinates}
          >
            <DroppableArea id="completed" handleDrop={() => {}}>
              {" "}
              {/* Área donde se pueden soltar tareas completadas */}
              {completedTodos.map((todo) => (
                <DraggableItem
                  key={todo.id}
                  id={todo.id}
                  text={todo.text}
                  completed={todo.completed} // Marca la tarea como completada
                  isEditing={false} // Las tareas completadas no son editables
                  onToggleComplete={() => {}} // No realiza ninguna acción
                  onDelete={() => handleDeleteTask(todo.id)} // Llama a la función para eliminar la tarea
                  onEdit={() => {}} // No permite edición desde tareas completadas
                  onEditMode={() => {}} // No cambia el modo de edición
                />
              ))}
            </DroppableArea>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default TodoList; // Exporta el componente principal para ser usado en la aplicación
