package main.java.mqtt;

import java.util.HashMap;
import java.util.Map;

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
		StatusUpdate
	};
	public static String broker = "tcp://localhost:2000";
	String serverName = "WindTXServer";

	Map<PostTopic, MQTTPoster> posters;
	Map<SubscribeTopic, MQTTSubscriber> subscribers;
	MQTTNodeMock mock;

	public MQTTManager() {
		//Add the shutdown hook to close MQTT clients
		Thread shutdownHook = new Thread(() -> shutdownAll());
		Runtime.getRuntime().addShutdownHook(shutdownHook);
		
		//Create all clients
		posters = new HashMap<PostTopic, MQTTPoster>();
		subscribers = new HashMap<SubscribeTopic, MQTTSubscriber>();

		try {
			for (PostTopic t : PostTopic.values()) {
				posters.put(t, new MQTTPoster(serverName+"-"+t.toString(), t, 2));
			}
			for (SubscribeTopic t : SubscribeTopic.values()) {
				subscribers.put(t, new MQTTSubscriber(serverName+"-"+t.toString(), t, 2));
			}
			
			//Build mockup
			mock = new MQTTNodeMock();
			mock.start();
		} catch(Exception e) {
			System.out.println("Exception: "+e);
			e.printStackTrace();
		}
		
//		try {Thread.sleep(10000);}
//		catch (InterruptedException e) {e.printStackTrace();}
//		System.exit(0);
	}
	
	public void shutdownAll() {
		CLI.debug(Loc.MQTT, "Shutting down all clients...");
		try {
			for (Map.Entry<PostTopic, MQTTPoster> e : posters.entrySet()) {
				if (e.getValue().getClient().isConnected()) MQTTUtil.disconnect(e.getValue().getClient());
			}
			for (Map.Entry<SubscribeTopic, MQTTSubscriber> e : subscribers.entrySet()) {
				if (e.getValue().getClient().isConnected()) MQTTUtil.disconnect(e.getValue().getClient());
			}
			if (mock.getClient().isConnected()) MQTTUtil.disconnect(mock.getClient());
			mock.stop = true;
		} catch(Exception e) {
			CLI.debug(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}

	public static void main(String[] args) {
		new MQTTManager();
	}
	
	
}
