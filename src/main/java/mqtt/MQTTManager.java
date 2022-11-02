package main.java.mqtt;

import java.util.HashMap;
import java.util.Map;

import org.eclipse.paho.client.mqttv3.MqttException;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class MQTTManager {

	public static enum PostTopic {
		Config,
		Current,
		LiveTrigger
	};
	public static enum SubscribeTopic {
		Log,
		LiveReadings,
		StatusUpdate,
		LiveTrigger
	};
	public static String broker = "tcp://localhost:2000";
	String serverName = "WindTXServer";

	MQTTPoster poster;
	Map<SubscribeTopic, MQTTSubscriber> subscribers;
	MQTTNodeMock mock;

	public MQTTManager() {
		//Add the shutdown hook to close MQTT clients
		Thread shutdownHook = new Thread(() -> shutdownAll());
		Runtime.getRuntime().addShutdownHook(shutdownHook);

		//Create all MQTT clients
		subscribers = new HashMap<SubscribeTopic, MQTTSubscriber>();

		try {
			poster = new MQTTPoster(serverName+"-"+"PostClient", 2);
			for (SubscribeTopic t : SubscribeTopic.values()) {
				subscribers.put(t, new MQTTSubscriber(serverName+"-"+t.toString(), t, 2));
			}

			//Build mockup
			mock = new MQTTNodeMock();
			mock.start();
		} catch(MqttException e) {
			CLI.debug(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}

	public void sendLiveStart(String unit) {
		poster.sendMessage(unit+"-1", PostTopic.LiveTrigger);
	}

	public void sendLiveStop(String unit) {
		poster.sendMessage(unit+"-0", PostTopic.LiveTrigger);
	}

	public void shutdownAll() {
		CLI.debug(Loc.MQTT, "Shutting down all clients...");
		try {
			if (poster.getClient().isConnected()) MQTTUtil.disconnect(poster.getClient());
			for (Map.Entry<SubscribeTopic, MQTTSubscriber> e : subscribers.entrySet()) {
				if (e.getValue().getClient().isConnected()) MQTTUtil.disconnect(e.getValue().getClient());
			}
			mock.shutdownAll();
			mock.stop = true;
		} catch(Exception e) {
			CLI.debug(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}
}
