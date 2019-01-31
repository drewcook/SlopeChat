import * as firebase from 'firebase';
import "firebase/firestore";

class Fire {
	constructor() {
		this.init();
		this.observeAuth();
	}

	// Initialize Firebase Realtime Database
	init = () => {
		const firebaseConfig = {
			apiKey: "AIzaSyBHCu3VF2PsH0lJm9XzTTyKU5wnmRXbNZQ",
			authDomain: "slopechat.firebaseapp.com",
			databaseURL: "https://slopechat.firebaseio.com/",
			projectId: "slopechat",
			storageBucket: "slopechat.appspot.com"
		};
		firebase.initializeApp(firebaseConfig);
	}

	// Check if signed in or not
	observeAuth = () => firebase.auth().onAuthStateChanged(this.onAuthStateChanged);

	// Listen for authentication state to change.
	onAuthStateChanged = user => {
		// Initialize Firebase Cloud Firestore
		let db = firebase.firestore();
		let users = db.collection('users');
		// signed in
		if (user) {
			console.log('User is signed in and authenticated.');
			//console.log(user);
			// write user into users/ collection if record doesn't exist
			users.get().then(snapshot => {
				snapshot.forEach(doc => {
					if (doc.uid !== user.uid) {
						users.doc(user.uid).set({
							"name": user.displayName,
							"createdAt": new Date(),
							"lastLogin": new Date(),
							"profilePic": user.photoURL,
						});
					} else {
						users.doc(user.uid).update({"lastLogin": new Date()});
					}
				});
			}).catch(err => console.log('Error getting documents', err));
		}
		// not signed in
		else {
			console.log("User is signed out.");
		}

		// Do other things
	};

	get db() {
		return firebase.firestore();
	}

	get ref() {
		return this.db.collection('messages');
	}

	on = callback =>
		this.ref
			.limit(20)
			.onSnapshot(snapshot => callback(this.parse(snapshot)));

	parse = snapshot => {
		let messages = [];
		snapshot.forEach(doc => {
			console.log(doc.data())
			const { timestamp: numberStamp, text, user } = doc.data();
			const { key: _id } = doc.data();
			const timestamp = new Date(numberStamp);

			messages.push({
				_id,
				timestamp,
				text,
				user,
			});
		});
		return messages;
	}

	off() {
		this.ref.off();
	}

	get uid() {
		return (firebase.auth().currentUser || {}).uid;
	}

	get timestamp() {
		return firebase.firestore.FieldValue.serverTimestamp();
	}

	send = messages => {
		for (let i = 0; i < messages.length; i++) {
			const { text, user } = messages[i];
			const message = {
				_id: i,
				text,
				user,
				timestamp: this.timestamp,
			};
			this.append(message);
		}
	};

	append = message => this.ref.doc("Chat Uno").set(message, {merge: true});


	// Facebook Authentication
	loginWithFacebook = async () => {
		const { type, token } = await Expo.Facebook.logInWithReadPermissionsAsync(
			"566780290461704",
			{ permissions: [
				'public_profile',
				//'user_friends', <-- needs App Review from Facebook to use
			] }
		);

		if (type === 'success') {
			// Build Firebase credential with the Facebook access token.
			const credential = firebase.auth.FacebookAuthProvider.credential(token);

			// Sign in with credential from the Facebook user.
			firebase.auth().signInAndRetrieveDataWithCredential(credential).catch((error) => {
				// Handle Errors here.
			});
		}
	}

}

Fire.shared = new Fire();
export default Fire;