// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		await getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				console.log(racers)
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// render starting UI
	renderAt('#race', renderRaceStartView(store.track_id, store.racer_id))

	// Get player_id and track_id from the store
	const { player_id, track_id } = store

	// invoke the API call to create the race, then save the result
	console.time('get race')
	const race = await createRace(player_id, track_id)
	console.timeEnd('get race')

	// update the store with the race id
	store.race_id = race.ID - 1
	// The race has been created, now start the countdown
	console.group('start race')

	// call the async function runCountdown
	await runCountdown()
	// call the async function startRace
	await startRace(store.race_id)

	//call the async function runRace
	await runRace(race.ID)

	console.groupEnd()
}

function runRace(raceID) {
	let errors = 0

	return new Promise((resolve, reject) => {
	// use Javascript's built in setInterval method to get race info every 500ms
		const raceInterval = setInterval(async function() {
			try {
				const race = await getRace(raceID)
				errors = 0
			} catch (e) {
				console.error(e)
				errors++

				if (errors >= 5) {
					clearInterval(raceInterval)
					return reject(e)
				}
			}

			// if the race info status property is "in-progress", update the leaderboard by calling:
			if (race.status === "in-progress") {
				renderAt('#leaderBoard', raceProgress(res.positions))
			}

			// if the race info status property is "finished"
			else if (race.status === "finished") {
				clearInterval(raceInterval)
				renderAt('#race', resultsView(res.positions))
				resolve(res)
			}
		},500)
	})
	.catch(err => console.log("Problem with runRace request::", err))
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			// use Javascript's built in setInterval method to count down once per second
			// run this DOM manipulation to decrement the countdown for the user
			const interval = setInterval(function() {
				document.getElementById('big-numbers').innerHTML = --timer

				// if the countdown is done, clear the interval, resolve the promise, and return
				if (timer === 0) {
					clearInterval(interval)
					return resolve()
				}
			}, 1000)
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected racer to the store
	store.player_id = target.id
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected track id to the store
	store.track_id = target.id
}

async function handleAccelerate() {
	console.log("accelerate button clicked", store)
	// Invoke the API call to accelerate
	await fetch(`${SERVER}/api/races/${store.player_id}/accelerate`, {
		 method: 'POST', 
		 ...defaultFetchOpts() })
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// Make a fetch call (with error handling!) to each of the following API endpoints

async function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	const trackList = await fetch(`${SERVER}/api/tracks`)
	.catch(err => console.log("Problem with getTracks request::", err))
	return await trackList.json();
}

async function getRacers() {
	// GET request to `${SERVER}/api/cars`
	const racers = await fetch(`${SERVER}/api/cars`)
	.catch(err => console.log("Problem with getRacers request::", err))
	return await racers.json();
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

async function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	const race = await fetch(`${SERVER}/api/races/${id-1}`)
	.catch(err => console.log("Problem with getRace request::", err))
	return await race.json();
}

async function startRace(id) {
	return await fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log("Problem with startRace request::", err))
}

async function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	return await fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	.catch(err => console.log("Problem with accelerate request::", err))
}