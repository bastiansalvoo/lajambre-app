-- Insertar la categoría y obtener el ID (que será 1)
INSERT INTO "Category" (name) VALUES ('Hamburguesas');

-- Insertar los productos asociados a la categoría 1
INSERT INTO "Product" (name, description, price, "isAvailable", "categoryId") VALUES
('Clásica', 'Lechuga, tomate, cebolla morada y salsa de la casa.', 7990, true, 1),
('La de Palta', 'Mucha palta nacional, mayo casera y tomate.', 8490, true, 1),
('BBQ Bacon', 'Tocino crocante, aros de cebolla y salsa BBQ.', 8990, true, 1),
('Triple Cheese', 'Tres láminas de cheddar fundido y cebolla grillada.', 8790, true, 1),
('Mostaza Miel', 'Pollo o carne con salsa mostaza miel y rúcula.', 8290, true, 1);

-- Insertar algunos extras
INSERT INTO "Extra" (name, price) VALUES 
('Extra Carne', 2000),
('Extra Queso', 1000),
('Papas Fritas Medianas', 2500);