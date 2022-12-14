import Head from "next/head";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Navbar } from "@frontend/components/Nav";
import { UsernamePopup } from "@frontend/components/UsernamePopup";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import log from "@shared/logger";
import Link from "next/link";
import io from "socket.io-client";
let socket;

export default function Friends() {
	const [userFriends, setData] = useState(null);
	const [userData, setUserData] = useState(null);
	const [isLoading, setLoading] = useState(false);
	const { data: session } = useSession();
	const [showUsernameInput, setShowUsernameInput] = useState(false);
	const myEmail = session?.user.email;
	const name = session?.user.name;
	const pfp = session?.user.image;
	const [update, setUpdate] = useState(false);

	useEffect(() => {
		socketInitializer();
	}, [session]);
	const socketInitializer = async () => {
		await fetch("/api/socket");
		socket = io();

		socket.on("SyncPage", async (request) => {
			setUpdate(await request);
		});
	};

	useEffect(() => {
		setLoading(true);
		fetch("/api/friends", {
			body: JSON.stringify({ myEmail }),
			method: "POST",
		}).then(async (res) => {
			if (myEmail === undefined) return;
			setData(await res.json());
			setLoading(false);
		});
	}, [session, update, myEmail]);

	useEffect(() => {
		fetch("/api/profileSetup", {
			body: JSON.stringify({ name, pfp, myEmail, add: false }),
			method: "POST",
		}).then(async (res) => {
			var user = await res.json();
			log.debug(user);
			if (user.success === false) {
				setShowUsernameInput(true);
			}
		});
	}, [session, myEmail, name, pfp]);

	const onChange = (e) => {
		const query = e.target.value;
		log.debug(query);
	};

	const addFriend = (e) => {
		const username = e.target.value;
		const type = e.target.id;
		console.log(username);
		e.target.disabled = true;
		fetch("/api/manageFriend", {
			body: JSON.stringify({ username, myEmail, type }),
			method: "POST",
		}).then(async (res) => {
			var msg = await res.json();
			console.log(msg);
			if (msg.success === true) {
				e.target.disabled = false;
				if (type === "cancel") {
					e.target.id = "add";
					e.target.className =
						"float-right ml-4 text-nord_dark-200 bg-nord_green pl-3 pr-3 rounded-lg";
					e.target.innerText = "Add Friend";
					socket.emit("requestToSync", "cancel");
				} else if (type === "accept") {
					e.target.id = "message";
					e.target.className =
						"float-right ml-4 text-nord_dark-200 bg-nord_yellow pl-3 pr-3 rounded-lg";
					e.target.innerText = "Message";
					socket.emit("requestToSync", "accept");
				} else if (type === "remove") {
					e.target.id = "add";
					e.target.className =
						"float-right ml-4 text-nord_dark-200 bg-nord_green pl-3 pr-3 rounded-lg";
					e.target.innerText = "Add Friend";
					socket.emit("requestToSync", "remove");
				}
			}
			log.debug(msg);
		});
	};

	useEffect(() => {
		fetch("/api/getUserdata", {
			body: JSON.stringify({ myEmail }),
			method: "POST",
		}).then(async (res) => {
			setUserData(await res.json());
		});
	}, [session, showUsernameInput, myEmail]);

	const links = [
		{ id: "1", text: "Home", path: "/" },
		{
			id: "2",
			text: "Profile",
			path: `/profile/${userData?.user?.username}`,
		},
	];

	log.debug(!isLoading);
	if (userFriends === null) return;
	log.debug(userFriends);
	return (
		<div>
			<Head>
				<title>Friends</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main>
				<Navbar links={links} />
				{showUsernameInput && (
					<UsernamePopup activate={showUsernameInput} />
				)}
				<h1 className="text-center text-nord_light-300 font-bold text-xl pt-10">
					{name}&#39;s Friends
				</h1>

				<div className="grid">
					<div className="grid place-items-center">
						<form>
							<input
								onChange={onChange}
								placeholder="Search"
								className="bg-nord_dark-200 outline-none rounded-lg text-nord_light-300 pt-2 pb-2 pl-4 pr-4 mt-4 mb-4"
							></input>
						</form>
					</div>
					<h1 className="text-nord_blue-300 font-bold text-2xl mb-4 ml-4 mt-4">
						Requests
					</h1>

					<ol id="pending" className="w-auto mb-4 p-4">
						{userFriends.friends !== null &&
							showUsernameInput !== true &&
							userFriends.friends.Outgoing.map((users) => (
								<li
									key={users.name}
									className="text-nord_light-300 p-3 mb-4 bg-nord_dark-200 rounded-lg"
								>
									<button
										onClick={addFriend}
										value={users.username}
										id="cancel"
										className="float-right ml-4 text-nord_light-300 bg-nord_red pl-3 pr-3 rounded-lg"
									>
										Cancel Request
									</button>
									<Link
										href={`/profile/${users.username}`}
										className="mb-1"
									>
										<button className="inline-flex items-center text-nord_red">
											<span className="pr-2 text-nord_light-300">
												{users.name}
											</span>
											<FaArrowLeft />
										</button>
									</Link>
									<div className="  text-nord_green rounded-lg "></div>
								</li>
							))}
						{userFriends.friends !== null &&
							showUsernameInput !== true &&
							userFriends.friends.Incoming.map((users) => (
								<li
									key={users.name}
									className="text-nord_light-300 p-3 mb-4 bg-nord_dark-200 rounded-lg"
								>
									<button
										onClick={addFriend}
										value={users.username}
										id="accept"
										className="float-right ml-4 text-nord_dark-200 bg-nord_green pl-3 pr-3 rounded-lg"
									>
										Accept
									</button>
									<Link
										href={`/profile/${users.username}`}
										className="mb-2"
									>
										<button className="inline-flex items-center text-nord_green">
											<span className="pr-2 text-nord_light-300">
												{users.name}
											</span>
											<FaArrowRight />
										</button>
									</Link>

									<div className="  text-nord_green rounded-lg "></div>
								</li>
							))}
					</ol>

					<h1 className="text-nord_blue-300 font-bold text-2xl mb-4 ml-4">
						Friends
					</h1>
					<ol id="friends" className="w-auto mb-4 p-4">
						{userFriends.friends !== null &&
							showUsernameInput !== true &&
							userFriends.friends.friends.map((users) => (
								<li
									key={users.name}
									className="text-nord_light-300 p-3 mb-4 bg-nord_dark-200 rounded-lg"
								>
									<button
										value={users.username}
										onClick={addFriend}
										id="remove"
										className="float-right ml-4 text-nord_light-300 bg-nord_red pl-3 pr-3 rounded-lg"
									>
										Remove
									</button>
									<Link
										href={`/profile/${users.username}`}
										className="mb-1"
									>
										{users.name}
									</Link>
								</li>
							))}
					</ol>
				</div>
			</main>
		</div>
	);
}
