package main.java.mqtt;

import java.util.HashMap;
import java.util.Map;

import org.eclipse.paho.client.mqttv3.MqttException;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class MQTTManager {

	public static enum PostTopic {
		Config, //Server sends info about its state
		LiveTrigger, //Server requests for node to start transmitting live data
		StatusRequest //Server requests status (location, battery, ip) from node
	};
	public static enum SubscribeTopic {
		Log, //Logs from node
		LiveReadings, //Live readings from node
		StatusUpdate, //Recieve status from node
		LiveTrigger, //For testing only
		StatusRequest //For testing only
	};
	public static String broker = "tcp://54.203.107.18:1883";
	String serverName = "WindTXServer";
	boolean allConnected;

	MQTTPoster poster;
	Map<SubscribeTopic, MQTTSubscriber> subscribers;
	MQTTNodeMock mock = null;

	public MQTTManager() {
		//Add the shutdown hook to close MQTT clients
		Thread shutdownHook = new Thread(() -> shutdownAll());
		Runtime.getRuntime().addShutdownHook(shutdownHook);
		allConnected = false;

		//Create all MQTT clients
		subscribers = new HashMap<SubscribeTopic, MQTTSubscriber>();

		try {
			poster = new MQTTPoster(serverName+"-"+"PostClient", 2);
			for (SubscribeTopic t : SubscribeTopic.values()) {
				subscribers.put(t, new MQTTSubscriber(serverName+"-"+t.toString(), t, 2));
			}
			//Build mockup
			//mock = new MQTTNodeMock();
			//mock.start();
			allConnected = true;
		} catch(MqttException e) {
			CLI.debug(Loc.MQTT, "Exception: "+e);
			//e.printStackTrace();
		}
	}

	public void sendLiveStart(String unit) {
		if (!allConnected) return;
		poster.sendMessage(unit+"-1", PostTopic.LiveTrigger);
	}

	public void sendLiveStop(String unit) {
		if (!allConnected) return;
		poster.sendMessage(unit+"-0", PostTopic.LiveTrigger);
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
			CLI.debug(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}
}
