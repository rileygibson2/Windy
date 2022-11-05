package main.java.mqtt;

import java.util.HashMap;
import java.util.Map;

import org.eclipse.paho.client.mqttv3.MqttException;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mock.MQTTNodeMock;

public class MQTTManager {

	public static enum PostTopic {
		Config, //Server sends info about its state
		/**
		 * Control for live data
		 * Unit name [|]
		 * Stop/Start [0]
		 */
		LiveTrigger,
		/**
		 * Node status resuests
		 * Unit name [|]
		 */
		StatusRequest
	};
	public static enum SubscribeTopic {
		/**
		 * Logs from node.
		 * Unit name [|]
		 * Log epoch time [0]
		 * Wind speed at time log dispatched [1]
		 * Peak gust epoch time [2]
		 * Peak gust [3]
		 * Min wind speed [4]
		 * Avg wind speed [5]
		 * Direction [6]
		 */
		Log,
		/**
		 * Live values from node
		 * Unit name [|]
		 * Wind speed [0]
		 * Direction [1]
		 */
		LiveReadings,
		/**
		 *	Status response from log
		 *	Unit name [|]
		 *	Unit IP [0]
		 *	Epoch time of status update [1]
		 *	Battery [2]
		 *	Lat [3]
		 *	Lon [4]
		 *	Location accuracy [5]
		 */
		StatusUpdate,
		LiveTrigger, //For testing only
		StatusRequest //For testing only
	};
	public static String broker = "tcp://54.203.107.18:1883";
	String serverName = "WindTXServer";
	boolean allConnected;

	MQTTPoster poster;
	Map<SubscribeTopic, MQTTSubscriber> subscribers;
	MQTTNodeMock mock = null;

	public MQTTManager(boolean mockNode) {
		allConnected = false;
		
		//Create all MQTT clients
		subscribers = new HashMap<SubscribeTopic, MQTTSubscriber>();

		try {
			poster = new MQTTPoster(serverName+"-"+"PostClient", 2);
			for (SubscribeTopic t : SubscribeTopic.values()) {
				subscribers.put(t, new MQTTSubscriber(serverName+"-"+t.toString(), t, 2));
			}
			//Build mockup
			if (mockNode) {
				mock = new MQTTNodeMock();
				mock.start();
			}
			allConnected = true;
		} catch(MqttException e) {
			CLI.error(Loc.MQTT, "Exception: "+e);
			//e.printStackTrace();
		}
	}

	public void sendLiveStart(String unit) {
		if (!allConnected) return;
		poster.sendMessage(unit+"|1", PostTopic.LiveTrigger);
	}

	public void sendLiveStop(String unit) {
		if (!allConnected) return;
		poster.sendMessage(unit+"|0", PostTopic.LiveTrigger);
	}
	
	public void sendStatusRequest(String unit) {
		if (!allConnected) return;
		poster.sendMessage(unit, PostTopic.StatusRequest);
	}

	public void shutdownAll() {
		CLI.debug(Loc.MQTT, "Shutting down all clients...");
		try {
			if (poster!=null&&poster.getClient().isConnected()) MQTTUtil.disconnect(poster.getClient());
			for (Map.Entry<SubscribeTopic, MQTTSubscriber> e : subscribers.entrySet()) {
				if (e.getValue().getClient().isConnected()) MQTTUtil.disconnect(e.getValue().getClient());
			}
			if (mock!=null) {
				mock.shutdownAll();
				mock.stop = true;
			}
		} catch(Exception e) {
			CLI.error(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}
}
