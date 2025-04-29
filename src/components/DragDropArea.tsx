import React from "react";
import { ReactSortable } from "react-sortablejs";

interface Item {
  id: string;
}

interface DragDropAreaProps {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
  renderItem?: (item: string) => React.ReactNode;
}

const DragDropArea: React.FC<DragDropAreaProps> = ({ title, items, setItems, renderItem }) => {
  const wrappedItems = items.map((id) => ({ id }));

  const handleChange = (newList: Item[]) => {
    setItems(newList.map((item) => item.id));
  };

  return (
    <div className="droppable-area">
      <strong>{title}</strong>
      <ReactSortable
        list={wrappedItems}
        setList={handleChange}
        animation={200}
        group="pivot"
      >
        {wrappedItems.map((item) => (
          <div key={item.id} className="draggable-item">
            {renderItem ? renderItem(item.id) : item.id}
          </div>
        ))}
      </ReactSortable>
    </div>
  );
};

export default DragDropArea;
