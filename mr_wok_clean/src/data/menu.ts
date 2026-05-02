export const menuData = {
  categories: [
    "Appetizers", "Noodles", "Rice", "Proteins", "Veggies", "Sauces", "Combos", "Drinks"
  ],
  items: [
    { id: 'a1', name: 'Spring Rolls (3 pcs)', description: 'Crispy vegetable spring rolls', price: 95, category: 'Appetizers', badges: ['Veg', 'Popular'] },
    { id: 'a2', name: 'Gyoza Dumplings (6 pcs)', description: 'Pan-seared chicken dumplings', price: 125, category: 'Appetizers', badges: ['Popular'] },
    { id: 'a3', name: 'Chicken Wings Teriyaki (6 pcs)', description: 'Sticky sweet teriyaki wings', price: 165, category: 'Appetizers', badges: [] },
    { id: 'a4', name: 'Edamame', description: 'Steamed soybeans with sea salt', price: 85, category: 'Appetizers', badges: ['Veg'] },
    { id: 'a5', name: 'Wonton Soup', description: 'Clear broth with chicken wontons', price: 100, category: 'Appetizers', badges: [] },

    { id: 'n1', name: 'Longevity Chinese Egg Noodles', description: 'Thick egg noodles with fresh veggies', price: 145, category: 'Noodles', badges: ['Popular'] },
    { id: 'n2', name: 'Udon Japanese Noodles', description: 'Thick chewy wheat noodles', price: 160, category: 'Noodles', badges: [] },
    { id: 'n3', name: 'Rice Vermicelli Noodles', description: 'Thin glass noodles', price: 130, category: 'Noodles', badges: ['Veg Option'] },
    { id: 'n4', name: 'Flat Rice Noodles', description: 'Pad Thai style flat noodles', price: 145, category: 'Noodles', badges: [] },
    { id: 'n5', name: 'Ramen Noodles', description: 'Classic wavy egg noodles', price: 155, category: 'Noodles', badges: [] },

    { id: 'r1', name: 'Jasmine Steamed Rice', description: 'Fragrant white rice', price: 110, category: 'Rice', badges: ['Veg Option'] },
    { id: 'r2', name: 'Fried Rice', description: 'Wok-fried with egg & soy', price: 125, category: 'Rice', badges: [] },
    { id: 'r3', name: 'Coconut Jasmine Rice', description: 'Steamed with coconut milk', price: 135, category: 'Rice', badges: [] },

    { id: 'p1', name: 'Chicken Breast', description: 'Sliced tender chicken', price: 60, category: 'Proteins', badges: [] },
    { id: 'p2', name: 'Beef Strips', description: 'Marinated beef slices', price: 75, category: 'Proteins', badges: [] },
    { id: 'p3', name: 'Shrimp', description: 'Juicy wok-seared shrimp', price: 85, category: 'Proteins', badges: ['Popular'] },
    { id: 'p4', name: 'Smoked Duck', description: 'Rich smoked duck breast', price: 90, category: 'Proteins', badges: [] },
    { id: 'p5', name: 'Mixed Seafood', description: 'Shrimp, calamari, and fish', price: 100, category: 'Proteins', badges: [] },
    { id: 'p6', name: 'Tofu', description: 'Crispy fried tofu cubes', price: 50, category: 'Proteins', badges: ['Veg'] },

    { id: 'v1', name: 'Pak Choi', description: 'Asian leafy greens', price: 25, category: 'Veggies', badges: ['Veg'] },
    { id: 'v2', name: 'Pineapple', description: 'Sweet pineapple chunks', price: 25, category: 'Veggies', badges: ['Veg'] },
    { id: 'v3', name: 'Mushrooms', description: 'Fresh button mushrooms', price: 30, category: 'Veggies', badges: ['Veg'] },
    { id: 'v4', name: 'Broccoli', description: 'Crunchy broccoli florets', price: 25, category: 'Veggies', badges: ['Veg'] },
    { id: 'v5', name: 'Corn', description: 'Sweet corn kernels', price: 20, category: 'Veggies', badges: ['Veg'] },
    { id: 'v6', name: 'Crushed Peanuts', description: 'Roasted peanut garnish', price: 25, category: 'Veggies', badges: ['Veg'] },
    { id: 'v7', name: 'Bean Sprouts', description: 'Fresh crunchy sprouts', price: 20, category: 'Veggies', badges: ['Veg'] },
    { id: 'v8', name: 'Chili Peppers', description: 'Fresh sliced chilies', price: 15, category: 'Veggies', badges: ['Spicy', 'Veg'] },

    { id: 's1', name: 'Bangkok Thai Sweet Chilli', description: 'Sweet with a kick', price: 25, category: 'Sauces', badges: ['Spicy'] },
    { id: 's2', name: 'Osaka Sweet Teriyaki', description: 'Classic sweet soy glaze', price: 25, category: 'Sauces', badges: ['Popular'] },
    { id: 's3', name: 'Black Bean Sauce', description: 'Savory and earthy', price: 25, category: 'Sauces', badges: [] },
    { id: 's4', name: 'Hoisin Sauce', description: 'Sweet and salty plum sauce', price: 25, category: 'Sauces', badges: [] },
    { id: 's5', name: 'Mr. Wok Secret Sauce', description: 'Our signature house blend', price: 30, category: 'Sauces', badges: ['Popular'] },
    { id: 's6', name: 'Spicy Szechuan', description: 'Fiery chili and peppercorn', price: 25, category: 'Sauces', badges: ['Spicy'] },
    { id: 's7', name: 'Sweet & Sour', description: 'Tangy and sweet', price: 25, category: 'Sauces', badges: [] },
    { id: 's8', name: 'BBQ Asian', description: 'Smoky Asian barbecue', price: 25, category: 'Sauces', badges: [] },
    { id: 's9', name: 'Oyster Sauce', description: 'Rich umami flavor', price: 25, category: 'Sauces', badges: [] },

    { id: 'c1', name: 'Chicken Teriyaki Box', description: 'Noodles/rice, chicken, teriyaki, veggies', price: 205, category: 'Combos', badges: ['Popular'] },
    { id: 'c2', name: 'Beef Teriyaki Box', description: 'Noodles/rice, beef, teriyaki, veggies', price: 235, category: 'Combos', badges: [] },
    { id: 'c3', name: 'Sweet & Sour Chicken Box', description: 'Noodles/rice, chicken, sweet & sour, veggies', price: 200, category: 'Combos', badges: ['Popular'] },
    { id: 'c4', name: 'Oyster Sauce Beef Noodles', description: 'Noodles, beef, oyster sauce, veggies', price: 230, category: 'Combos', badges: [] },
    { id: 'c5', name: 'Pad Thai Chicken', description: 'Flat noodles, chicken, pad thai sauce, peanuts', price: 210, category: 'Combos', badges: ['Popular'] },
    { id: 'c6', name: 'Pad Thai Shrimp', description: 'Flat noodles, shrimp, pad thai sauce, peanuts', price: 240, category: 'Combos', badges: [] },
    { id: 'c7', name: 'Kung Pao Chicken Box', description: 'Noodles/rice, chicken, kung pao sauce, peanuts', price: 215, category: 'Combos', badges: [] },
    { id: 'c8', name: 'Spicy Szechuan Beef Box', description: 'Noodles/rice, beef, szechuan sauce, veggies', price: 235, category: 'Combos', badges: ['Spicy'] },
    { id: 'c9', name: 'House Special Box', description: 'Mixed protein, noodles/rice, secret sauce', price: 275, category: 'Combos', badges: ['Popular'] },
    { id: 'c10', name: 'Vegetarian Noodle Box', description: 'Noodles, mixed veggies, choice of sauce', price: 170, category: 'Combos', badges: ['Veg'] },

    { id: 'd1', name: 'Soft Drink (Can)', description: 'Pepsi, 7Up, Mirinda', price: 30, category: 'Drinks', badges: [] },
    { id: 'd2', name: 'Water', description: 'Mineral water', price: 20, category: 'Drinks', badges: [] },
    { id: 'd3', name: 'Fresh Orange Juice', description: 'Freshly squeezed', price: 70, category: 'Drinks', badges: [] },
    { id: 'd4', name: 'Asian Iced Tea', description: 'Lemon or Jasmine', price: 65, category: 'Drinks', badges: [] },
    { id: 'd5', name: 'Mango Juice', description: 'Fresh mango juice', price: 70, category: 'Drinks', badges: [] },
  ]
};
