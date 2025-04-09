document.addEventListener("DOMContentLoaded", function() {
    fetch('../foods.yaml')
        .then(response => response.text())
        .then(data => {
            const foods = jsyaml.load(data).foods;
            displayFoods(foods);
        });

    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalCalories = 0;
    let totalCaloriesGoal = 0;

    const proteinInput = document.getElementById('protein');
    const carbsInput = document.getElementById('carbs');
    const fatInput = document.getElementById('fat');
    const totalCaloriesLabel = document.getElementById('total-calories');
    const updateButton = document.getElementById('update-total-calories');

    function updateTotalCaloriesGoal() {
        console.log('Updating total calories goal');
        const protein = parseFloat(proteinInput.value) || 0;
        const carbs = parseFloat(carbsInput.value) || 0;
        const fat = parseFloat(fatInput.value) || 0;

        totalCaloriesGoal = (protein * 4) + (carbs * 4) + (fat * 9);
        totalCaloriesLabel.textContent = totalCaloriesGoal.toFixed(2);
        updateFoodOptions();
    }

    updateButton.addEventListener('click', function() {
        updateTotalCaloriesGoal();
        updateAggregatedValuesGoals();
    });


    /**
     * Populates the DOM with food options based on the provided food categories and items.
     * Each food item is displayed with its image, description, macros, and a button to view more details.
     * Clicking on the image triggers a quantity selection modal, while clicking the description button shows a detailed modal.
     * 
     * @param {Object} foods - An object where keys are food category names and values are arrays of food items.
     * @param {Array} foods[].ingredients - The list of ingredients for the food item.
     * @param {string} foods[].description - A textual description of the food item, supports newline characters.
     * @param {string} foods[].image - The URL of the food item's image.
     * @param {string} [foods[].description_image] - An optional URL for an additional description image.
     * @param {string} foods[].name - The name of the food item.
     * @param {number} foods[].protein - The amount of protein in grams.
     * @param {number} foods[].carbs - The amount of carbohydrates in grams.
     * @param {number} foods[].fat - The amount of fat in grams.
     * @param {number} foods[].calories - The total calories of the food item.
     * @param {string} [foods[].recipeLink] - An optional URL to the recipe for the food item.
     * 
     * @throws Will log an error if an element with the expected ID for a food category is not found in the DOM.
     */
    function displayFoods(foods) {
        for (const [food_category, items] of Object.entries(foods)) {
            const mealOptions = document.getElementById(`${food_category}-options`);
            if (!mealOptions) {
                console.error(`Element with ID ${food_category}-options not found.`);
                continue;
            }
            items.forEach(item => {
                const foodDiv = document.createElement('div');
                foodDiv.className = 'food-option';
                foodDiv.dataset.ingredients = JSON.stringify(item.ingredients);
                const description = item.description.replace(/\n/g, '<br>'); // Replace newline characters with <br> tags
                foodDiv.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <button class="description-button" data-name="${item.name}" data-description="${description}" data-description-image="${item.description_image || ''}">View Description</button>
                    <p>${item.name}</p>
                    <div class="macros">
                        <p>Protein: ${item.protein} g</p>
                        <p>Carbs: ${item.carbs} g</p>
                        <p>Fat: ${item.fat} g</p>
                        <p class="calories">Calories: ${item.calories} kcal</p>
                    </div>
                `;
                mealOptions.appendChild(foodDiv);
    
                foodDiv.querySelector('.description-button').addEventListener('click', function() {
                    showModal(this.dataset.name, this.dataset.description, item.image, item.recipeLink);
                });
    
                foodDiv.querySelector('img').addEventListener('click', function() {
                    if (foodDiv.querySelector('.exceeds-goal-banner')) {
                        return;
                    }
                    showQuantityModal(foodDiv, item);
                });
            });
        }
        updateFoodOptions();
    }

    function updateFoodOptions() {
        document.querySelectorAll('.food-option').forEach(foodDiv => {
            const itemCalories = parseFloat(foodDiv.querySelector('.calories').textContent.split(' ')[1]);
            const banner = foodDiv.querySelector('.exceeds-goal-banner');
            if (totalCalories + itemCalories > totalCaloriesGoal) {
                if (!banner) {
                    const newBanner = document.createElement('div');
                    newBanner.className = 'exceeds-goal-banner';
                    newBanner.textContent = 'Exceeds Your Goal';
                    foodDiv.appendChild(newBanner);
                }
            } else {
                if (banner) {
                    banner.remove();
                }
            }
        });
        updateSelectedFoods();
    }

    function updateSelectedFoods() {
        const selectedBreakfast = document.getElementById('selected-breakfast');
        const selectedLunch = document.getElementById('selected-lunch');
        const selectedDinner = document.getElementById('selected-dinner');
        const selectedSnacks = document.getElementById('selected-snacks');

        // Clear the tables only once
        selectedBreakfast.innerHTML = '<tr><th>Quantity</th><th>Food</th></tr>';
        selectedLunch.innerHTML = '<tr><th>Quantity</th><th>Food</th></tr>';
        selectedDinner.innerHTML = '<tr><th>Quantity</th><th>Food</th></tr>';
        selectedSnacks.innerHTML = '<tr><th>Quantity</th><th>Food</th></tr>';

        const selectedFoods = document.querySelectorAll('.food-option.selected');
        const fragmentBreakfast = document.createDocumentFragment();
        const fragmentLunch = document.createDocumentFragment();
        const fragmentDinner = document.createDocumentFragment();
        const fragmentSnacks = document.createDocumentFragment();

        selectedFoods.forEach(foodDiv => {
            const mealType = foodDiv.closest('.meal-category').querySelector('h3').textContent.toLowerCase();
            const foodName = foodDiv.querySelector('p').textContent;
            const quantity = foodDiv.querySelector('.quantity-label').textContent.split(': ')[1];

            const foodItem = document.createElement('tr');
            foodItem.innerHTML = `<td>${quantity}</td><td>${foodName}</td>`;

            if (mealType === 'breakfast') {
                fragmentBreakfast.appendChild(foodItem);
            } else if (mealType === 'lunch') {
                fragmentLunch.appendChild(foodItem);
            } else if (mealType === 'dinner') {
                fragmentDinner.appendChild(foodItem);
            } else if (mealType === 'snacks') {
                fragmentSnacks.appendChild(foodItem);
            }
        });

        selectedBreakfast.appendChild(fragmentBreakfast);
        selectedLunch.appendChild(fragmentLunch);
        selectedDinner.appendChild(fragmentDinner);
        selectedSnacks.appendChild(fragmentSnacks);
    }

    /**
     * Displays a modal with meal details including name, description, image, and a recipe link.
     *
     * @param {string} name - The name of the meal to display in the modal. This is passed from the `data-name` attribute of the clicked button.
     * @param {string} description - The description of the meal, which can include HTML tags like <br>. This is passed from the `data-description` attribute of the clicked button.
     * @param {string} [descriptionImage] - The URL of the image to display in the modal. This is passed from the `image` property of the `item` object.
     * @param {string} [recipeLink] - The URL of the recipe link. This is passed from the `recipeLink` property of the `item` object, or it defaults to undefined if not provided.
     *
     * This function performs the following steps:
     * 1. Retrieves the modal element and updates its content with the provided meal details.
     * 2. Updates the meal name and description in the modal.
     * 3. Displays the meal image if a valid URL is provided; otherwise, hides the image section.
     * 4. Configures the recipe link if provided; otherwise, hides the link section.
     * 5. Displays the modal by setting its display style to 'block'.
     *
     * Note: If the element with ID 'recipeLink' is not found, an error is logged to the console.
     */
    function showModal(name, description, descriptionImage, recipeLink) {
        const modal = document.getElementById('mealModal');
        document.getElementById('mealName').textContent = name;
        document.getElementById('mealDescription').innerHTML = description; // Use innerHTML to render <br> tags
    
        const descriptionImageElement = document.getElementById('mealDescriptionImage');
        if (descriptionImage) {
            descriptionImageElement.src = descriptionImage;
            descriptionImageElement.style.display = 'block';
        } else {
            descriptionImageElement.style.display = 'none';
        }

        const recipeLinkContainer = document.getElementById('recipeLinkButtonContainer');
        const recipeLinkElement = document.getElementById('recipeLink');
        if (recipeLink) {
            recipeLinkElement.href = recipeLink; // Set the recipe link URL
            recipeLinkContainer.style.display = 'block'; // Show the recipe link button
        } else {
            recipeLinkContainer.style.display = 'none'; // Hide the recipe link button if no link is provided
        }
                
        modal.style.display = 'block';
    }

    function showQuantityModal(foodDiv, item) {
        const modal = document.getElementById('quantityModal');
        modal.style.display = 'block';

        const quantityInput = document.getElementById('quantityInput');
        quantityInput.value = '';
        quantityInput.focus();

        function addFood() {
            const newQuantity = parseFloat(quantityInput.value);
            const oldQuantity = parseFloat(foodDiv.dataset.quantity) || 0;

            if (isNaN(newQuantity) || newQuantity <= 0.1) {
                alert('Please enter a valid quantity.');
                return;
            }

            if (newQuantity === oldQuantity) {
                modal.style.display = 'none';
                return;
            }

            if (totalCalories + (item.calories * newQuantity) - (item.calories * oldQuantity) > totalCaloriesGoal) {
                alert('Adding this item exceeds your total calories goal.');
                return;
            }

            console.log(`Item: ${item.name}, Old Quantity: ${oldQuantity}, New Quantity: ${newQuantity}`);

            foodDiv.classList.add('selected');
            foodDiv.querySelector('img').classList.add('selected');
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
                foodDiv.classList.remove('selected');
                foodDiv.querySelector('img').classList.remove('selected');
                if (quantityLabel) {
                    quantityLabel.remove();
                }
                if (deselectButton) {
                    deselectButton.remove();
                }
                updateAggregatedValues(-item.protein * foodDiv.dataset.quantity, -item.carbs * foodDiv.dataset.quantity, -item.fat * foodDiv.dataset.quantity, -item.calories * foodDiv.dataset.quantity);
                foodDiv.dataset.quantity = 0;
            });

            updateAggregatedValues(
                item.protein * newQuantity - item.protein * oldQuantity,
                item.carbs * newQuantity - item.carbs * oldQuantity,
                item.fat * newQuantity - item.fat * oldQuantity,
                item.calories * newQuantity - item.calories * oldQuantity
            );

            foodDiv.dataset.quantity = newQuantity;
            modal.style.display = 'none';
        }

        document.getElementById('quantitySubmit').onclick = addFood;

        // FIXME: When clcking enter, it runs addFood twice or for all previous foods so total calories goes super high
        // quantityInput.addEventListener('keydown', function(event) {
        //     if (event.key === 'Enter') {
        //         addFood();
        //     }
        // });
    }

    function updateAggregatedValues(protein, carbs, fat, calories) {
        totalProtein += protein;
        totalCarbs += carbs;
        totalFat += fat;
        totalCalories += calories;

        document.getElementById('total-protein').textContent = totalProtein.toFixed(2);
        document.getElementById('total-carbs').textContent = totalCarbs.toFixed(2);
        document.getElementById('total-fat').textContent = totalFat.toFixed(2);
        document.getElementById('total-aggregated-calories').textContent = totalCalories.toFixed(2);

        updateFoodOptions();
    }   

    function updateAggregatedValuesGoals(){
        // Get goal values from input fields
        const goalProtein = parseFloat(document.getElementById('protein').value) || 0;
        const goalCarbs = parseFloat(document.getElementById('carbs').value) || 0;
        const goalFat = parseFloat(document.getElementById('fat').value) || 0;
        const goalCalories = (goalProtein * 4) + (goalCarbs * 4) + (goalFat * 9);
    
        // Update goal values in the table
        document.getElementById('goal-protein').textContent = goalProtein.toFixed(2);
        document.getElementById('goal-carbs').textContent = goalCarbs.toFixed(2);
        document.getElementById('goal-fat').textContent = goalFat.toFixed(2);
        document.getElementById('goal-calories').textContent = goalCalories.toFixed(2);
    }

    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            console.log('Closing modal');
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        const quantityModal = document.getElementById('quantityModal');
        const mealModal = document.getElementById('mealModal');
        if (event.target === quantityModal || event.target === mealModal) {
            console.log('Closing modal by clicking outside');
            event.target.style.display = 'none';
        }
    });

    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            console.log('Closing modal by pressing Escape');
            const quantityModal = document.getElementById('quantityModal');
            const mealModal = document.getElementById('mealModal');
            quantityModal.style.display = 'none';
            mealModal.style.display = 'none';
        }
    });
});