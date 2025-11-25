const displayDis = document.querySelector(".dis-value");
const form = document.querySelector(".form");
const select = document.querySelector('[name="activity"]');
const duration = document.querySelector(".form-input--duration");
const cadence = document.querySelector(".form-input--cadence");
const elevgain = document.querySelector(".form-input--elevgain");
const date = document.querySelector(".form-input--date");
const subCon = document.querySelector(".sub-con");
let points = [];
let map;
let distance;
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    map = L.map("map").setView([latitude, longitude], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", markfun);
    tasks.forEach((task) => addTask(task, map));
  },
  () => alert("oops! can't find your location")
);

//////////////////////////////////////////////////////////
const updateField = () => {
  if (select.value == "Cycling") {
    cadence.parentElement.classList.add("form-row--hidden");
    elevgain.parentElement.classList.remove("form-row--hidden");
    cadence.required = false;
    elevgain.required = true;
  } else if (select.value == "Running") {
    cadence.parentElement.classList.remove("form-row--hidden");
    elevgain.parentElement.classList.add("form-row--hidden");
    elevgain.required = false;
    cadence.required = true;
  }
};
updateField();
select.addEventListener("change", updateField);
const markfun = (e) => {
  if (points.length >= 2) return;
  points.push([e.latlng.lat, e.latlng.lng]);
  L.circle([e.latlng.lat, e.latlng.lng], {
    color: "black",
    fillOpacity: 0.8,
    radius: 30,
  }).addTo(map);
  if (points.length === 2) {
    // displayDis.textContent = distance + " km";
    form.style.display = "grid";
    L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "foot",
      }),
      waypoints: [
        L.latLng(points[0][0], points[0][1]),
        L.latLng(points[1][0], points[1][1]),
      ],
      lineOptions: {
        addWaypoints: false,
      },
    })
      .on("routesfound", (e) => {
        const routes = e.routes;
        console.log(e.routes[0].name);
        const summary = routes[0].summary;
        distance = (summary.totalDistance / 1000).toFixed(2);
        console.log(summary);
        console.log(distance);
        displayDis.textContent = distance + " km";
      })
      .addTo(map);
  }
};

const addTask = function (task, map) {
  const col = task.select_val == "Running" ? "orange" : "rgb(135, 235, 160)";
  const icon = task.select_val == "Running" ? "🏃‍♂️" : "🚵‍♀️";
  const cone = L.circle(task.coords[0], {
    color: "black",
    fillOpacity: 0.8,
    radius: 30,
  }).addTo(map);
  const ctwo = L.circle(task.coords[1], {
    color: "black",
    fillOpacity: 0.8,
    radius: 30,
  }).addTo(map);
  const rout = L.Routing.control({
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      profile: "foot",
    }),
    waypoints: [
      L.latLng(task.coords[0][0], task.coords[0][1]),
      L.latLng(task.coords[1][0], task.coords[1][1]),
    ],
    lineOptions: {
      addWaypoints: false,
    },
  }).addTo(map);

  const li = document.createElement("li");
  li.className = `workout workout--${task.select_val.toLowerCase()}`;
  li.innerHTML = `<h3 class="date-detail">${task.select_val} On ${
    task.date_val
  }</h3>
            <button class="delete-btn">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
            <div class="workout-detail">
              <span class="workout-icon">${icon}</span>
              <span class="workout-value">${task.dis_val}</span>
              <span class="workout-unit">Km</span>
            </div>
            <div class="workout-detail">
              <span class="workout-icon">🕓</span>
              <span class="workout-value">${task.duration_val}</span>
              <span class="workout-unit">min</span>
            </div>
            <div class="workout-detail">
              <span class="workout-icon">💨</span>
              <span class="workout-value">${(
                Number(task.dis_val) /
                (task.duration_val / 60)
              ).toFixed(2)}</span>
              <span class="workout-unit">km/h</span>
            </div>
            <div class="workout-detail">
              <span class="workout-icon">${
                task.select_val == "Running" ? "🦶" : "🗻"
              }</span>
              <span class="workout-value">${
                task.select_val == "Running" ? task.cad_val : task.elev_val
              }</span>
              <span class="workout-unit">${
                task.select_val == "Running" ? "spm" : "m"
              }</span>
            </div>
`;
  subCon.appendChild(li);
  const setlat = (task.coords[0][0] + task.coords[1][0]) / 2;
  const setlng = (task.coords[0][1] + task.coords[1][1]) / 2;
  li.addEventListener("click", () => map.setView([setlat, setlng], 13));
  li.querySelector(".delete-btn").addEventListener("click", () => {
    li.remove();
    cone.remove();
    ctwo.remove();
    rout.remove();
    tasks = tasks.filter((t) => t != task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
  });
};
const dateFormat = (d) => {
  console.log(d);
  const [year, month, date] = d.split("-");
  return `${date}-${month}-${year}`;
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  // if (!distance) {
  //   alert("Pick 2 points first!");
  //   return;
  // }

  const select_val = select.value;
  const duration_val = duration.value;
  const elev_val = elevgain.value;
  const cad_val = cadence.value;
  const date_val = dateFormat(date.value);
  const dis_val = Number(distance);
  const task = {
    select_val,
    duration_val,
    elev_val,
    cad_val,
    date_val,
    dis_val,
    coords: [...points],
  };
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  addTask(task, map);
  points = [];
  distance = null;
  form.reset();
  displayDis.textContent = "-- km";
  updateField();
  form.style.display = "none";
});
