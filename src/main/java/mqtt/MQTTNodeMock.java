package main.java.mqtt;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import main.java.DataManager;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mqtt.MQTTManager.PostTopic;
import main.java.mqtt.MQTTManager.SubscribeTopic;

/**
 * Mocksup a windy node.
 * Remember post and sub topics are flipped here, as the unit will do
 * the reverse of what the enums were set up to represent on the server.
 * 
 * @author thesmileyone
 */
public class MQTTNodeMock extends Thread {

	final String clientName = "MQTTNodeMock";
	MqttClient poster;
	Map<PostTopic, MqttClient> subscribers;
	int qos;
	boolean stop;

	Set<String> mockedLiveUnits; //All units this is currently mocking live readings for

	public MQTTNodeMock() throws MqttException {
		this.stop = false;
		this.qos = 2;

		//Setup post client
		this.poster = new MqttClient(MQTTManager.broker, clientName+"-Poster", new MemoryPersistence());
		MQTTUtil.connect(poster);

		//Setup subscribers
		subscribers = new HashMap<PostTopic, MqttClient>();
		for (PostTopic t : PostTopic.values()) {
			MqttClient subscriber = new MqttClient(MQTTManager.broker, clientName+"-"+t.toString(), new MemoryPersistence());

			//Callback and connect
			subscriber.setCallback(new MQTTMockCallback(this, t));
			MQTTUtil.connect(subscriber);
			subscriber.subscribe(t.toString(), qos);
			subscribers.put(t, subscriber);
		}

		//Other stuff
		mockedLiveUnits = new HashSet<String>();
	}

	@Override
	public void run() {
		while (!stop) {
			
			//Send live reading to all mockedUnits currently with live trigger active
			for (String unit : mockedLiveUnits) {
				int speed = (int) (Math.random()*(100-1)+1);
				int direction = (int) (Math.random()*(360-0)+0);
				int level = 1; //Alert level
				if (speed>DataManager.amberAlarm) level = 2;
				if (speed>DataManager.redAlarm) level = 3;
				String out = speed+","+direction+","+level;
				//String unit = new File("units").listFiles()[0].getName();

				try {
					MQTTUtil.sendMessage(poster, SubscribeTopic.LiveReadings.toString(), qos, unit+"-"+out);
				} catch (Exception e1) {e1.printStackTrace();}

				try {Thread.sleep(5000);}
				catch (InterruptedException e) {e.printStackTrace();}
			}
			
			/*long record[] = new long[4];
			record[0] = new Date().getTime(); //Timestamp
			record[1] = (int) (Math.random()*(100-1)+1); //Windspeed
			record[2] = (int) (Math.random()*(360-0)+0); //Direction
			record[3] = 1; //Alert level
			if (record[1]>DataManager.amberAlarm) record[3] = 2;
			if (record[1]>DataManager.redAlarm) record[3] = 3;
			String out = Arrays.toString(record).replace(" ", "");*/
		}
	}
	
	public void shutdownAll() {
		CLI.debug(Loc.MQTT, "Shutting down all mock clients...");
		try {
			if (poster.isConnected()) MQTTUtil.disconnect(poster);
			for (Map.Entry<PostTopic, MqttClient> e : subscribers.entrySet()) {
				if (e.getValue().isConnected()) MQTTUtil.disconnect(e.getValue());
			}
		} catch(Exception e) {
			CLI.debug(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}

}

class MQTTMockCallback implements MqttCallback {
	MQTTNodeMock mock;
	PostTopic topic;

	public MQTTMockCallback(MQTTNodeMock mock, PostTopic topic) {
		this.mock = mock;
		this.topic = topic;
	}


	public void connectionLost(Throwable cause) {
		CLI.debug(Loc.MQTT, "Connection Lost: " + cause.getMessage());
	}

	public void messageArrived(String top, MqttMessage payload) {
		String message = new String(payload.getPayload());
		PostTopic topic = null;
		for (PostTopic t : PostTopic.values()) {
			if (top.equals(t.toString())) topic = t;
		}
		if (topic==null||topic!=this.topic) return;

		switch(topic) {
		case LiveTrigger: //Start or stop mocking this unit's live readings
			//Split unit from log data
			String unit = message.split("-")[0];
			int trigger = Integer.parseInt(message.split("-")[1]);
			if (trigger==1) mock.mockedLiveUnits.add(unit);
			if (trigger==0) mock.mockedLiveUnits.remove(unit);
			break;
		default:
			break;
		}

	}

	public void deliveryComplete(IMqttDeliveryToken token) {
		System.out.println("deliveryComplete---------" + token.isComplete());
	}
}
