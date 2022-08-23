import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
	const [supportsBluetooth, setSupportsBluetooth] = useState(false);
	const [isDisconnected, setIsDisconnected] = useState(true);
	const [batteryLevel, setBatteryLevel] = useState(null);
	const [boardType, setBoardType] = useState(null);
	const [bleDevice, setBleDevice] = useState(null);
	const [boardState, setBoardState] = useState('');

	const stateRef = useRef();

	stateRef.current = boardState;

	// When the component mounts, check that the browser supports Bluetooth
	useEffect(() => {
		if (navigator.bluetooth) {
			setSupportsBluetooth(true);
		}
	}, []);

	/**
	 * Let the user know when their device has been disconnected.
	 */
	const onDisconnected = (event) => {
		console.log(`The device ${event.target} is disconnected`);
		//alert(`The device ${event.target} is disconnected`);
		setIsDisconnected(true);
	}

	/**
	 * Update the value shown on the web page when a notification is
	 * received.
	 */
	const handleNotifications = async (event) => {
		let obj = event.target.value;
		const decoder = new TextDecoder('utf-8');
		let value = decoder.decode(obj);
		console.log('Chess board result:' + value);
		//console.log('BoardState ref is: ', stateRef.current);
		if (stateRef.current === 'xBOARDTYPEz') {
			setBoardType(value);
		} else {
			setBatteryLevel(value);
		}
		setBoardState("");
		while (stateRef.current !== '') {
			await new Promise(r => setTimeout(r, 1000));
			console.log('Trying to clear');
		}
	}

	/**
	 * Attempts to connect to a Bluetooth device and subscribe to
	 * battery level readings using the battery service.
	 */
	const connectToDeviceAndSubscribeToUpdates = async () => {

		const service_squareoff_uuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
		const char_squareoff_rx_uuid = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
		const char_squareoff_tx_uuid = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

		console.log("Search for service: " + service_squareoff_uuid);

		try {
			// Search for Bluetooth devices that advertise a battery service
			console.log("Request device");
			const device = await navigator.bluetooth
				.requestDevice({
					filters: [
						{name: 'Square Off'},
					],
					optionalServices: [
						service_squareoff_uuid
					]
				});

			setBleDevice(device);

			console.log("Found device");
			setIsDisconnected(false);

			// Add an event listener to detect when a device disconnects
			device.addEventListener('gattserverdisconnected', onDisconnected);
			
			await new Promise(r => setTimeout(r, 1000));

			// Try to connect to the remote GATT Server running on the Bluetooth device
			console.log("Connect");
			const server = await device.gatt.connect();
			
			await new Promise(r => setTimeout(r, 200));

			// Get the battery service from the Bluetooth device
			console.log("Get service");
			const service = await server.getPrimaryService(service_squareoff_uuid);
			
			await new Promise(r => setTimeout(r, 1000));

			// Get the squareoff_tx characteristic from the Bluetooth device
			console.log("Get squareoff_tx characteristic");
			console.log("Should have UUID: " + char_squareoff_tx_uuid);
			const squareoff_tx_char = await service.getCharacteristic(char_squareoff_tx_uuid);

			await new Promise(r => setTimeout(r, 1000));

			await squareoff_tx_char.startNotifications();
			squareoff_tx_char.addEventListener('characteristicvaluechanged', handleNotifications);
			
			await new Promise(r => setTimeout(r, 200));
			
			// Get the squareoff_rx characteristic from the Bluetooth device
			console.log("Get squareoff_rx characteristic");
			console.log("Should have UUID: " + char_squareoff_rx_uuid);
			const squareoff_rx_char = await service.getCharacteristic(char_squareoff_rx_uuid);


			const encoder = new TextEncoder('utf-8');

			let str = "";

			await new Promise(r => setTimeout(r, 1000));
			str = "xRSTVARz";
			console.log(str);
			await squareoff_rx_char.writeValue(encoder.encode(str));

			await new Promise(r => setTimeout(r, 1000));
			str = "xCONNECTEDz";
			console.log(str);
			await squareoff_rx_char.writeValue(encoder.encode(str));

			str = "xBOARDTYPEz";
			setBoardState(str);
			console.log(str);
			while(stateRef.current !== str) {
				await new Promise(r => setTimeout(r, 1000));
			};
			await squareoff_rx_char.writeValue(encoder.encode(str));
			while(stateRef.current !== str);

			await new Promise(r => setTimeout(r, 1000));
			str = "xGAMEBLACKz";
			console.log(str);
			await squareoff_rx_char.writeValue(encoder.encode(str));

			str = "xd2d4z";
			setBoardState(str);
			console.log(str);
			while(stateRef.current !== str) {
				await new Promise(r => setTimeout(r, 1000));
			};
			await squareoff_rx_char.writeValue(encoder.encode(str));
			while(stateRef.current !== str);
			
			console.log("Wait a while before disconnecting");
			await new Promise(r => setTimeout(r, 6000));

			console.log("Disconnect");
			device.gatt.disconnect();

		} catch(error) {
			console.log(`There was an error: ${error}`);
			if (bleDevice && bleDevice.gatt) {
				if (bleDevice.gatt.connected) {
					console.log('Force bluetooth disconnection');
					bleDevice.gatt.disconnect();
				} else {
					console.log('Bluetooth disconnected');
				}
			}
		}

		console.log("Infinite loop, otherwise component is teared down.");
		while(1);
	};

	return (
		<div className="App">
		<h1>Square off</h1>
		<p>
		Enable Bluetooth for your browser. This is an experimental feature which does not work in any browser!
		If enabled, you can suddenly control Bluetooth devices from the browser, very cool!
		</p>
		<p>
		You will need to run a Chrome browser and you need to enable:
		</p>
		<ul>
		<li><a href="chrome://flags/#enable-experimental-web-platform-features">chrome://flags/#enable-experimental-web-platform-features</a> (copy-paste this, it won't work automatically)
		</li>
		<li><a href="chrome://flags/#enable-web-bluetooth">chrome://flags/#enable-web-bluetooth</a> (copy-paste this, it won't work automatically)
		</li>
		</ul>
		{supportsBluetooth && !isDisconnected &&
			<p>Level: {batteryLevel}</p>
		}
		{supportsBluetooth && isDisconnected &&
				<button onClick={connectToDeviceAndSubscribeToUpdates}>Find Square Off</button>
		}
		{!supportsBluetooth &&
				<p>This browser doesn't support the Web Bluetooth API</p>
		}
		{supportsBluetooth &&
			<p>Board type: {boardType}</p>
		}
		</div>
	);
}

export default App;
