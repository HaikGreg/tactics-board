import React, { Component } from 'react';
import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import PitchEdit from './editors/PitchEdit'
import SvgToImg from './editors/SvgToImg'
import AppTools from './ui/AppTools'
import AnimPlayer from './ui/AnimPlayer'
import ConfirmDialog from './ui/ConfirmDialog'
import PitchFutsal from './pitch/PitchFutsal'
import DrawMode from './pitch/DrawMode'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { v4 as uuidv4 } from 'uuid';
// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// For auth using: https://github.com/firebase/firebaseui-web-react
import './App.css';
import './firebaseui-styling.global.css';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyDAb0oHSQCeihL0Op9agehWqYQh1-7E4xE",
	authDomain: "tactics-board-1c644.firebaseapp.com",
	projectId: "tactics-board-1c644",
	storageBucket: "tactics-board-1c644.appspot.com",
	messagingSenderId: "704589627362",
	appId: "1:704589627362:web:b110cc834a5f5c19c543bb",
	measurementId: "G-PDXB2VPRL8"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
//const analytics = getAnalytics(firebaseApp);


class App extends Component {
	constructor(props) {
		super(props);
		// application Material-UI theme
		this.appTheme = createTheme();
		// references
		this.refPitchEdit = React.createRef();
		this.refSvgToImg = React.createRef();
		this.refConfirmDialog = React.createRef();
		this.refAnimPlayer = React.createRef();
		// event handlers
		this.SaveImage = this.SaveImage.bind(this);
		this.CreateNewScheme = this.CreateNewScheme.bind(this);
		this.CreateNewAnimation = this.CreateNewAnimation.bind(this);
		this.AnimCreate = this.AnimCreate.bind(this);
		this.DeleteAnimation = this.DeleteAnimation.bind(this);
		this.AnimDelete = this.AnimDelete.bind(this);
		this.PitchReset = this.PitchReset.bind(this);
		this.ExtrasCreate = this.ExtrasCreate.bind(this);
		this.OnPitchModified = this.OnPitchModified.bind(this);
		this.OnDrawModeModified = this.OnDrawModeModified.bind(this);
		this.SnackbarOpen=this.SnackbarOpen.bind(this);
		this.SnackbarOnClose=this.SnackbarOnClose.bind(this);
		this.AnimKeyFrameAdd=this.AnimKeyFrameAdd.bind(this);
		this.AnimKeyFrameDelete=this.AnimKeyFrameDelete.bind(this);
		this.AnimKeyFrameNext=this.AnimKeyFrameNext.bind(this);
		this.AnimKeyFramePrevious=this.AnimKeyFramePrevious.bind(this);
		this.AnimKeyFrameDurationSet=this.AnimKeyFrameDurationSet.bind(this);
		this.AnimStart=this.AnimStart.bind(this);
		this.AnimStop=this.AnimStop.bind(this);
		this.AnimFrame=this.AnimFrame.bind(this);
		this.animPlayerAnchorEl=this.animPlayerAnchorEl.bind(this);
		this.animPlayerShow=this.animPlayerShow.bind(this);
		this.LocalStorageLoad = this.LocalStorageLoad.bind(this);
		this.LocalStorageSave = this.LocalStorageSave.bind(this);
		this.LocalStorageDelete = this.LocalStorageDelete.bind(this);

		// init default state
		this.pitch = this.DefaultPitch();
		this.pitch.onModified = this.OnPitchModified;
		this.drawMode = new DrawMode();
		this.drawMode.onModified = this.OnDrawModeModified;
		this.state = {
			isSignedIn: false,
			pitch: this.pitch,
			drawMode: this.drawMode,
			snackBar: {
				Show: false,
				Severity: 'info',
				Message: ''
			}
		}
	}

	componentDidMount() {
		// mount handler for authentication
		this.unregisterAuthObserver = firebaseApp.auth().onAuthStateChanged((user) => {
			console.log("Current user",user);
			this.setState({
				isSignedIn: !!user
			});
		});
		// load previous board editing
		this.LocalStorageLoad();
	}

	componentWillUnmount() {
		this.unregisterAuthObserver();
	}

	DefaultPitch() {
		const id = uuidv4();
		const pitch = new PitchFutsal(id);
		pitch.initDefault(
			200, 8, 120, 
			100, 5, 80
		);
		return pitch;
	}

	PitchReset() {
		console.log("Pitch reset");
		this.pitch.onModified = null;
		this.pitch = this.DefaultPitch();
		this.pitch.onModified = this.OnPitchModified;
		this.drawMode.onModified = null;
		this.drawMode = new DrawMode();
		this.drawMode.onModified = this.OnDrawModeModified;
		this.setState({
			pitch: this.pitch,
			drawMode: this.drawMode
		});
		this.LocalStorageDelete();
	}

	OnPitchModified(newPitch) {
		this.pitch.onModified = null;
		this.pitch = newPitch;
		this.pitch.onModified = this.OnPitchModified;
		this.setState({
			pitch: this.pitch
		});
	}

	OnDrawModeModified(newDrawMode) {
		this.drawMode.onModified = null;
		this.drawMode = newDrawMode;
		this.drawMode.onModified = this.OnDrawModeModified;
		this.setState({
			drawMode: this.drawMode
		});
		// update pitch overlay
		// TODO: reconsider this
		this.pitch.overlay = this.drawMode.pitchOverlay;
	}

	CreateNewScheme() {
		if (!this.state.pitch.isModified) {
			return;
		}
		this.refConfirmDialog.current.Show(
			"Create new scheme", "Pitch is modified, are you sure you want to discard changes?",
			this.PitchReset
		);
	}

	CreateNewAnimation() {
		this.refConfirmDialog.current.Show(
			"Create new animation", "Are you sure you want to create new animation?",
			this.AnimCreate
		);
	}

	DeleteAnimation() {
		this.refConfirmDialog.current.Show(
			"Delete animation", "Are you sure you want to delete animation, only first key frame will be kept?",
			this.AnimDelete
		);
	}

	SaveImage() {
		console.log("App save image");
		let svg = this.refPitchEdit.current.getSVG();
		this.refSvgToImg.current.toImg(
			svg.svgText, 
			svg.width, svg.height, 
			svg.width/2, svg.height/2
		);
	}

	LocalStorageSave() {
		console.log("Saving to localStorage.");
		let data = this.state.pitch.save();
		localStorage.setItem("tactics-board-current", JSON.stringify(data));
	}

	LocalStorageLoad() {
		console.log("Loading from localStorage.");
		let json = localStorage.getItem("tactics-board-current");
		if (null === json) {
			return;
		}
		this.state.pitch.load(JSON.parse(json));
	}

	LocalStorageDelete() {
		console.log("Deleting from localStorage.");
		localStorage.removeItem("tactics-board-current");
	}

	// function to open Snackbar
	SnackbarOpen(severity, message) {
		this.setState({
			snackBar: {
				Show: true,
				Severity: severity,
				Message: message
			}
		});
	}

	// Event when Snackbar closes
	SnackbarOnClose(){
		// read current state to avoid changing message while hiding
		const severity = this.state.snackBar.Severity;
		const message = this.state.snackBar.Message;
		// hide snackbar
		this.setState({
			snackBar: {
				Show: false,
				Severity: severity,
				Message: message
			}
		});
	}

	ExtrasCreate(t, width, height) {
		this.pitch.extrasCreate(
			t, this.state.drawMode.color, 
			width, height
		);
	}

	AnimCreate() {
		this.pitch.animCreate();
	}

	AnimDelete() {
		this.pitch.animDelete();
	}

	AnimKeyFrameAdd() {
		if (this.pitch.animKeyFrameAdd()){
			this.SnackbarOpen("success", "New key frame added to animation");
		} else {
			this.SnackbarOpen("error", "Can't add new key frame no change is done to current key frame");
		}
	}

	AnimKeyFrameDelete() {
		if (this.pitch.animKeyFrameDelete()) {
			this.SnackbarOpen("success", "Key frame deleted from animation");
 		} else {
			this.SnackbarOpen("error", "Can't delete key frame, only last can be deleted.");
		}
	}

	AnimKeyFrameNext() {
		if (!this.pitch.animKeyFrameNext()) {
			this.SnackbarOpen("warning", "No more key frames to navigate");
		}
	}

	AnimKeyFramePrevious() {
		if (!this.pitch.animKeyFramePrevious()) {
			this.SnackbarOpen("warning", "You are on first key frame");
		}
	}

	AnimKeyFrameDurationSet(duration){
		if (!this.pitch.animKeyFrameDurationSet(duration)) {
			this.SnackbarOpen("info", `You set the frame duration to ${duration}s` );
		}
	}

	AnimStart() {
		this.state.pitch.animStart();
	}

	AnimStop() {
		this.state.pitch.animStop();
	}

	AnimFrame(time) {
		this.state.pitch.animFrame(time);
	}

	animPlayerAnchorEl() {
		return this.refPitchEdit.current;
	}

	animPlayerShow() {
		if (this.state.pitch.AnimKeyFrames.length < 2) {
			this.SnackbarOpen("warning", "No animation is created");
			return;
		}
		this.refAnimPlayer.current.show();
    }

	render() {
		return (
			<React.Fragment>
				<StyledEngineProvider injectFirst>
					<ThemeProvider theme={this.appTheme}>
						<AppTools drawMode={this.state.drawMode}
							save={this.LocalStorageSave}
							saveImage={this.SaveImage}
							createNewScheme={this.CreateNewScheme}
							createNewAnimation={this.CreateNewAnimation}
							deleteAnimation={this.DeleteAnimation}
							animExists={this.state.pitch.AnimExists}
							animKeyFrameCurrent={this.state.pitch.AnimKeyFrameCurrent}
							animKeyFrameTotal={this.state.pitch.AnimKeyFrames.length}
							animKeyFrameAdd={this.AnimKeyFrameAdd}
							animKeyFrameDelete={this.AnimKeyFrameDelete}
							animKeyFrameNext={this.AnimKeyFrameNext}
							animKeyFramePrevious={this.AnimKeyFramePrevious}
							animKeyFrameDurationSet={this.AnimKeyFrameDurationSet}
							animPlayerShow={this.animPlayerShow}
							extrasCreate={this.ExtrasCreate}
							isSignedIn={this.state.isSignedIn}
							firebaseApp={firebaseApp}
						/>
						<PitchEdit ref={this.refPitchEdit} pitch={this.state.pitch} drawMode={this.state.drawMode} viewBoxLeft={0} viewBoxTop={0} viewBoxRight={4500} viewBoxBottom={2500} />
						<AnimPlayer
							ref={this.refAnimPlayer} 
							anchorEl={this.animPlayerAnchorEl}
							keyFramesNo={this.state.pitch.AnimKeyFrames.length}
							keyFrameDuration={this.state.pitch.AnimKeyFrameDuration}
							animStart={this.AnimStart}
							animStop={this.AnimStop}
							animFrame={this.AnimFrame}
						/>
						<ConfirmDialog ref={this.refConfirmDialog} />
						<Snackbar open={this.state.snackBar.Show} anchorOrigin={{ vertical: 'bottom', horizontal: 'center'}} autoHideDuration={2000} onClose={this.SnackbarOnClose}>
							<MuiAlert elevation={6} variant="filled" onClose={this.SnackbarOnClose} severity={this.state.snackBar.Severity}>{this.state.snackBar.Message}</MuiAlert>
						</Snackbar>
						<SvgToImg ref={this.refSvgToImg} />
					</ThemeProvider>
				</StyledEngineProvider>
			</React.Fragment>
		);
	}
}

export default App;
