function AddingCourses(x) {
    let courseList = document.getElementById("courseList"); // Changed variable name to match the div id
    x.forEach(course => {
        var courseDiv = document.createElement('div'); // Create a new div for each course
        courseDiv.innerHTML = `
        <p><img src="${course.img}""></p>
        <p><strong>Name:</strong> ${course.name}</p>
        <p><strong>Domain:</strong> ${course.domain}</p>
        <p><strong>Duration:</strong> ${course.duration}</p>
        <p><strong>Description:</strong> ${course.desc}</p>
        <hr>
    `;
        courseList.appendChild(courseDiv); // Append the newly created div for each course to the courseList
    });
}