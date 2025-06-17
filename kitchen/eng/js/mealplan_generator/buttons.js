window.mealPlanToLoad = null;
window.foodOptionsRendered = false;

function printMealPlan() {
    const selectedBreakfast = formatTable(document.getElementById('selected-breakfast').rows);
    const selectedLunch = formatTable(document.getElementById('selected-lunch').rows);
    const selectedDinner = formatTable(document.getElementById('selected-dinner').rows);
    const selectedSnacks = formatTable(document.getElementById('selected-snacks').rows);

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<style>');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }');
    printWindow.document.write('th, td { border: 2px solid #000; padding: 8px; }'); // Changed border color to solid black
    printWindow.document.write('th { background-color: #f0c117; color: #ffffff; text-align: left; }');
    printWindow.document.write('tr:nth-child(even) { background-color: #f9f9f9; }');
    printWindow.document.write('td { text-align: left; }'); // Default alignment for all td elements
    printWindow.document.write('td.quantity, td.unit { width: 100px; text-align: center; }'); // Fixed width and center alignment for quantity and unit
    printWindow.document.write('h2 { text-align: center; }'); // Center alignment for subtitles
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Breakfast</h2>');
    printWindow.document.write('<table>' + selectedBreakfast + '</table>');
    printWindow.document.write('<h2>Lunch</h2>');
    printWindow.document.write('<table>' + selectedLunch + '</table>');
    printWindow.document.write('<h2>Dinner</h2>');
    printWindow.document.write('<table>' + selectedDinner + '</table>');
    printWindow.document.write('<h2>Snacks</h2>');
    printWindow.document.write('<table>' + selectedSnacks + '</table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}



function formatTable(rows) {
    // let tableContent = '<tr><th>Food</th><th>Quantity</th><th>Unit</th></tr>';
    let tableContent = '<tr><th>Food</th><th>Quantity</th></tr>';
    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header row
        const cells = rows[i].cells;
        const foodName = cells[1].textContent;
        const quantity = cells[0].textContent;
        // const unit = cells[2] ? cells[2].textContent : ''; // Check if unit cell exists
        // tableContent += `<tr><td>${foodName}</td><td class="quantity">${quantity}</td><td class="unit">${unit}</td></tr>`;
        tableContent += `<tr><td>${foodName}</td><td class="quantity">${quantity}</td></tr>`;
    }
    return tableContent;
}


function saveMealPlan() {
    console.log('[saveMealPlan] Saving meal plan...');
    // Find all meal categories
    const mealCategories = document.querySelectorAll('.meal-category');
    const mealPlan = {};

    mealCategories.forEach(categoryDiv => {
        const categoryName = categoryDiv.querySelector('h3')?.textContent?.trim();
        console.log(`[saveMealPlan] Checking category: ${categoryName}`);
        // Look for a table with selected foods inside this category
        const selectedTable = categoryDiv.querySelector('table');
        if (selectedTable && selectedTable.rows.length > 1) {
            // Extract foods for this category
            const foods = extractMealData(selectedTable.rows).map(item => ({
                food: extractFoodName(item.food),
                quantity: item.quantity
            }));
            console.log(`[saveMealPlan] Foods found in table for ${categoryName}:`, foods);
            if (foods.length > 0 && categoryName) {
                mealPlan[categoryName] = foods;
            }
        } else {
            // Fallback: check for .food-option.selected divs inside this category
            const selectedFoods = Array.from(categoryDiv.querySelectorAll('.food-option.selected'));
            console.log(`[saveMealPlan] Foods found as selected divs for ${categoryName}:`, selectedFoods.map(f => f.dataset.foodName || f.textContent.trim()));
            if (selectedFoods.length > 0 && categoryName) {
                mealPlan[categoryName] = selectedFoods.map(foodDiv => {
                    return {
                        food: extractFoodName(foodDiv.dataset.foodName || foodDiv.textContent.trim()),
                        quantity: foodDiv.dataset.quantity || '1'
                    };
                });
            }
        }
    });

    if (Object.keys(mealPlan).length === 0) {
        alert("No foods selected. Please add at least one food to your meal plan before saving.");
        console.warn('[saveMealPlan] No foods selected, aborting save.');
        return;
    }

    const json = JSON.stringify(mealPlan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    let filename = prompt("Enter a name for your meal plan file:", "mealplan");
    if (!filename) {
        console.warn('[saveMealPlan] No filename provided, aborting save.');
        return;
    }
    if (!filename.endsWith(".json")) filename += ".json";

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[saveMealPlan] Meal plan saved as ${filename}`);
}

function extractFoodName(text) {
    // Try to extract the food name from the text
    // Remove everything before 'View Description' and after the next line
    if (!text) return '';
    // If data-food-name is present, it's already clean
    if (text.indexOf('View Description') !== -1) {
        // Find the part after 'View Description'
        let afterDesc = text.split('View Description')[1];
        if (afterDesc) {
            // The food name is the first non-empty line
            let lines = afterDesc.split('\n').map(l => l.trim()).filter(Boolean);
            // The first line should be the food name
            console.log('[extractFoodName] Extracted from View Description:', lines[0] || text.trim());
            return lines[0] || text.trim();
        }
    }
    // Fallback: just return the trimmed text
    console.log('[extractFoodName] Fallback, returning:', text.trim());
    return text.trim();
}

/**
 * Loads a meal plan from a JSON object and selects the corresponding foods in the UI.
 * @param {Object} mealPlan - The meal plan object loaded from JSON.
 * The structure is: { "Category Name": [ { food: "Food Name", quantity: "2" }, ... ], ... }
 */
function loadMealPlan(mealPlan) {
    console.log('[loadMealPlan] Loading meal plan:', mealPlan);
    if (!mealPlan || typeof mealPlan !== 'object') {
        alert('Invalid meal plan data.');
        console.error('[loadMealPlan] Invalid meal plan data:', mealPlan);
        return;
    }
    // Deselect all currently selected foods first
    document.querySelectorAll('.food-option.selected').forEach(div => {
        console.log('[loadMealPlan] Deselecting food:', div.dataset.foodName || div.textContent.trim());
        div.classList.remove('selected');
        if (div.dataset.quantity !== undefined) div.dataset.quantity = '';
        // Remove quantity label and deselect button if present
        const quantityLabel = div.querySelector('.quantity-label');
        if (quantityLabel) quantityLabel.remove();
        const deselectButton = div.querySelector('.deselect-button');
        if (deselectButton) deselectButton.remove();
        div.querySelector('img')?.classList.remove('selected');
    });

    // For each category in the meal plan
    Object.entries(mealPlan).forEach(([category, foods]) => {
        console.log(`[loadMealPlan] Processing category: ${category}`);
        // Find the meal-category div by matching the h3 text
        const categoryDiv = Array.from(document.querySelectorAll('.meal-category')).find(div => {
            const h3 = div.querySelector('h3');
            return h3 && h3.textContent.trim() === category;
        });
        if (!categoryDiv) {
            console.warn(`[loadMealPlan] Could not find category div for: ${category}`);
            return;
        }
        foods.forEach(item => {
            console.log(`[loadMealPlan] Looking for food: ${item.food} in category: ${category}`);
            // Find the .food-option div with the correct food name (case-insensitive match)
            const foodDiv = Array.from(categoryDiv.querySelectorAll('.food-option')).find(div => {
                const name = div.dataset.foodName ? div.dataset.foodName.trim() : div.querySelector('p')?.textContent.trim() || div.textContent.trim();
                return name.toLowerCase() === item.food.toLowerCase();
            });
            if (foodDiv) {
                console.log(`[loadMealPlan] Found food div for: ${item.food}`);
                // Find the food item data (macros, etc) from the DOM
                const macrosDiv = foodDiv.querySelector('.macros');
                const protein = parseFloat(macrosDiv?.querySelector('p:nth-child(1)')?.textContent.replace(/[^\d.]/g, '')) || 0;
                const carbs = parseFloat(macrosDiv?.querySelector('p:nth-child(2)')?.textContent.replace(/[^\d.]/g, '')) || 0;
                const fat = parseFloat(macrosDiv?.querySelector('p:nth-child(3)')?.textContent.replace(/[^\d.]/g, '')) || 0;
                const calories = parseFloat(macrosDiv?.querySelector('.calories')?.textContent.replace(/[^\d.]/g, '')) || 0;
                const oldQuantity = parseFloat(foodDiv.dataset.quantity) || 0;
                const newQuantity = parseFloat(item.quantity);

                // Simulate the same logic as addFood in showQuantityModal
                foodDiv.classList.add('selected');
                foodDiv.querySelector('img')?.classList.add('selected');
                let quantityLabel = foodDiv.querySelector('.quantity-label');
                if (!quantityLabel) {
                    quantityLabel = document.createElement('div');
                    quantityLabel.className = 'quantity-label';
                    foodDiv.insertBefore(quantityLabel, foodDiv.firstChild);
                }
                quantityLabel.textContent = `Quantity: ${newQuantity}`;

                let deselectButton = foodDiv.querySelector('.deselect-button');
                if (!deselectButton) {
                    deselectButton = document.createElement('button');
                    deselectButton.className = 'deselect-button';
                    deselectButton.textContent = 'Deselect';
                    foodDiv.insertBefore(deselectButton, quantityLabel.nextSibling);
                } else {
                    deselectButton.replaceWith(deselectButton.cloneNode(true));
                    deselectButton = foodDiv.querySelector('.deselect-button');
                }
                deselectButton.addEventListener('click', function() {
                    console.log(`[loadMealPlan] Deselect button clicked for: ${item.food}`);
                    foodDiv.classList.remove('selected');
                    foodDiv.querySelector('img')?.classList.remove('selected');
                    if (quantityLabel) quantityLabel.remove();
                    if (deselectButton) deselectButton.remove();
                    // Remove macros from totals
                    if (typeof updateAggregatedValues === 'function') {
                        updateAggregatedValues(-protein * newQuantity, -carbs * newQuantity, -fat * newQuantity, -calories * newQuantity);
                    }
                    foodDiv.dataset.quantity = 0;
                });

                // Update macros for this food (difference from old quantity)
                if (typeof updateAggregatedValues === 'function') {
                    console.log(`[loadMealPlan] Updating macros for ${item.food}:`, {
                        protein: protein * newQuantity - protein * oldQuantity,
                        carbs: carbs * newQuantity - carbs * oldQuantity,
                        fat: fat * newQuantity - fat * oldQuantity,
                        calories: calories * newQuantity - calories * oldQuantity
                    });
                    updateAggregatedValues(
                        protein * newQuantity - protein * oldQuantity,
                        carbs * newQuantity - carbs * oldQuantity,
                        fat * newQuantity - fat * oldQuantity,
                        calories * newQuantity - calories * oldQuantity
                    );
                }
                foodDiv.dataset.quantity = newQuantity;
            } else {
                console.warn(`[loadMealPlan] Could not find food div for: ${item.food} in category: ${category}`);
            }
        });
    });
    // Update UI
    if (typeof updateFoodOptions === 'function') {
        console.log('[loadMealPlan] Calling updateFoodOptions()');
        updateFoodOptions();
    }
    // Update aggregate values after loading meal plan
    // Try to get updateAggregatedValues from the main window if not found in this scope
    let updateAgg = (typeof window.updateAggregatedValues === 'function') ? window.updateAggregatedValues : (window.updateAggregatedValues || null);
    console.log('[loadMealPlan] updateAggregatedValues function found:', !!updateAgg);
    if (typeof updateAgg === 'function') {
        console.log('[loadMealPlan] Updating aggregated values after loading meal plan...');
        let totalProtein = 0, totalCarbs = 0, totalFat = 0, totalCalories = 0;
        document.querySelectorAll('.food-option.selected').forEach(div => {
            const macrosDiv = div.querySelector('.macros');
            const protein = parseFloat(macrosDiv?.querySelector('p:nth-child(1)')?.textContent.replace(/[^\d.]/g, '')) || 0;
            const carbs = parseFloat(macrosDiv?.querySelector('p:nth-child(2)')?.textContent.replace(/[^\d.]/g, '')) || 0;
            const fat = parseFloat(macrosDiv?.querySelector('p:nth-child(3)')?.textContent.replace(/[^\d.]/g, '')) || 0;
            const calories = parseFloat(macrosDiv?.querySelector('.calories')?.textContent.replace(/[^\d.]/g, '')) || 0;
            const quantity = parseFloat(div.dataset.quantity) || 0;
            totalProtein += protein * quantity;
            totalCarbs += carbs * quantity;
            totalFat += fat * quantity;
            totalCalories += calories * quantity;
        });
        // Reset and set the new totals
        updateAgg(-window.totalProtein || 0, -window.totalCarbs || 0, -window.totalFat || 0, -window.totalCalories || 0);
        updateAgg(totalProtein, totalCarbs, totalFat, totalCalories);
        window.totalProtein = totalProtein;
        window.totalCarbs = totalCarbs;
        window.totalFat = totalFat;
        window.totalCalories = totalCalories;
        console.log('[loadMealPlan] Aggregated values updated:', {
            totalProtein,
            totalCarbs,
            totalFat,
            totalCalories
        });
    } else {
        console.warn('[loadMealPlan] updateAggregatedValues function not found on window, skipping aggregation update.');
    }
    console.log('[loadMealPlan] Meal plan loaded and UI updated.');
}

/**
 * Opens a file dialog to upload a meal plan JSON file and loads it into the UI.
 */
function openAndLoadMealPlan() {
    console.log('[openAndLoadMealPlan] Opening file dialog for meal plan JSON...');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) {
            console.warn('[openAndLoadMealPlan] No file selected.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const mealPlan = JSON.parse(e.target.result);
                console.log('[openAndLoadMealPlan] Meal plan file loaded:', mealPlan);
                window.mealPlanToLoad = mealPlan;
                if (window.foodOptionsRendered) {
                    console.log('[openAndLoadMealPlan] Food options already rendered, loading meal plan now.');
                    loadMealPlan(window.mealPlanToLoad);
                    window.mealPlanToLoad = null;
                } else {
                    console.log('[openAndLoadMealPlan] Food options not yet rendered, will load after render.');
                }
                alert('Meal plan loaded!');
            } catch (err) {
                alert('Failed to load meal plan: ' + err.message);
                console.error('[openAndLoadMealPlan] Failed to parse meal plan JSON:', err);
            }
        };
        reader.readAsText(file);
        document.body.removeChild(input);
    });
    input.click();
}