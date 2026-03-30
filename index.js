// Get references to DOM elements
export const dom = {
	tasksList: document.querySelector("#tasks_list"),
	taskTemplate: document.querySelector("#task_template"),
	doneCount: document.querySelector("#done_count"),
	totalCount: document.querySelector("#total_count"),
	clearCompletedButton: document.querySelector("#clear_completed_button")
};

let draggedItem = null;

// Initialize data. Do we have anything stored?
if (localStorage.tasks) {
	let tasks = JSON.parse(localStorage.tasks);
	for (let task of tasks) {
		addItem(task);
	}
}
else {
	// Add one empty task to start with
	addItem();
}

// Keyboard shortcuts on task title inputs
dom.tasksList.addEventListener("keydown", e => {
	if (!e.target.matches("input.title")) {
		return;
	}

	let li = e.target.closest("li");

	if (e.key === "Enter" && !e.repeat) {
		addItem();
	}
	else if (e.key === "Backspace" && e.target.value.length === 0 && !e.repeat) {
		const previousSibling = li.previousElementSibling;
		const nextSibling = li.nextElementSibling;

		li.querySelector(".delete").click();
		focusTask(previousSibling ?? nextSibling ?? dom.tasksList.firstElementChild);
		e.preventDefault(); // prevent data corruption
	}
	else if (e.key === "ArrowUp") {
		focusTask(li.previousElementSibling);
		e.preventDefault();
	}
	else if (e.key === "ArrowDown") {
		focusTask(li.nextElementSibling);
		e.preventDefault();
	}
});

// Update done count when a checkbox changes
dom.tasksList.addEventListener("change", e => {
	if (e.target.matches(".done")) {
		updateCounts();
	}
});

// Delete button behavior
dom.tasksList.addEventListener("click", e => {
	if (!e.target.matches(".delete")) {
		return;
	}

	const li = e.target.closest("li");
	const previousSibling = li.previousElementSibling;
	const nextSibling = li.nextElementSibling;

	li.remove();
	updateCounts();

	focusTask(previousSibling ?? nextSibling ?? dom.tasksList.firstElementChild);

	// Keep at least one task in the list
	if (dom.tasksList.children.length === 0) {
		addItem();
	}
});

// Drag and drop
dom.tasksList.addEventListener("dragstart", e => {
	const li = e.target.closest("li");
	if (!li) {
		return;
	}

	draggedItem = li;
	li.classList.add("dragging");

	// Needed for some browsers
	e.dataTransfer.effectAllowed = "move";
	e.dataTransfer.setData("text/plain", "");
});

dom.tasksList.addEventListener("dragover", e => {
	e.preventDefault();

	const afterElement = getDragAfterElement(dom.tasksList, e.clientY);
	if (!draggedItem) {
		return;
	}

	if (afterElement === null) {
		dom.tasksList.append(draggedItem);
	}
	else if (afterElement !== draggedItem) {
		dom.tasksList.insertBefore(draggedItem, afterElement);
	}
});

dom.tasksList.addEventListener("drop", e => {
	e.preventDefault();
});

dom.tasksList.addEventListener("dragend", () => {
	if (draggedItem) {
		draggedItem.classList.remove("dragging");
		focusTask(draggedItem);
		draggedItem = null;
	}
});

// Store data when page is closed
globalThis.addEventListener("beforeunload", () => {
	localStorage.tasks = JSON.stringify(getData());
});

/**
 * Add a new item at the end of the todo list
 * @param {Object} data data for the item to be added
 */
export function addItem (data = { done: false, title: "" }) {
	dom.tasksList.insertAdjacentHTML("beforeend", dom.taskTemplate.innerHTML);

	let element = dom.tasksList.lastElementChild;

	element.querySelector(".title").value = data.title;

	let done = element.querySelector(".done");
	done.checked = data.done;

	updateCounts();
	focusTask(element);
}

/**
 * Delete all tasks that are marked as done
 */
export function clearCompleted () {
	const deleteButtons = dom.tasksList.querySelectorAll("li:has(.done:checked) .delete");

	for (const button of deleteButtons) {
		button.click();
	}
}

/**
 * Focus the title field of the specified task
 * @param {Node} element Reference to DOM element of the task to focus (or any of its descendants)
 */
export function focusTask (element) {
	element?.closest("li")?.querySelector("input.title").focus();
}

export function getData () {
	return Array.from(dom.tasksList.children).map(element => ({
		title: element.querySelector(".title").value,
		done: element.querySelector(".done").checked
	}));
}

function updateDoneCount () {
	dom.doneCount.textContent = dom.tasksList.querySelectorAll(".done:checked").length;
}

function updateTotalCount () {
	dom.totalCount.textContent = dom.tasksList.children.length;
}

// Update expressions etc when data changes
function updateCounts () {
	updateDoneCount();
	updateTotalCount();
}

function getDragAfterElement(container, y) {
	const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

	let closest = {
		offset: Number.NEGATIVE_INFINITY,
		element: null
	};

	for (const element of draggableElements) {
		const box = element.getBoundingClientRect();
		const offset = y - box.top - box.height / 2;

		if (offset < 0 && offset > closest.offset) {
			closest = { offset, element };
		}
	}

	return closest.element;
}
