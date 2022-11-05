package main.java.mock;

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

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mqtt.MQTTManager;
import main.java.mqtt.MQTTManager.PostTopic;
import main.java.mqtt.MQTTManager.SubscribeTopic;
import main.java.mqtt.MQTTUtil;
import main.java.units.UnitUtils;

/**
 * Mocksup a windy node.
 * Remember post and sub topics are flipped here, as the unit will do
 * the reverse of what the enums were set up to represent on the server.
 * 
 * @author thesmileyone
 */
public class MQTTNodeMock extends Thread {

	//Connection stuff
	final String clientName = "MQTTNodeMock";
	MqttClient poster;
	Map<PostTopic, MqttClient> subscribers;
	int qos;
	public boolean stop;
	
	//Node stuff 
	long nextLogTime;
	final static long logInterval = 30000;

	Set<String> mockedLiveUnits; //All units this is currently mocking live readings for

	public MQTTNodeMock() throws MqttException {
		this.stop = false;
		this.nextLogTime = System.currentTimeMillis()+logInterval;
		this.qos = 2;
		mockedLiveUnits = new HashSet<String>();

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
	}

	@Override
	public void run() {
		while (!stop) {
			//Mock logs from all units
			if (System.currentTimeMillis()>=nextLogTime) {
				for (String unit : UnitUtils.getAllUnits()) {
					long time = System.currentTimeMillis();
					long speed = (int) (Math.random()*(100-1)+1);
					long dir = (int) (Math.random()*(360-0)+0);
					String out = unit+"|"+time+","+speed+",0,0,0,0,"+dir;
					try {
						MQTTUtil.sendMessage(poster, SubscribeTopic.Log.toString(), qos, out);
					} catch (Exception e1) {e1.printStackTrace();}
				}
				nextLogTime = System.currentTimeMillis()+logInterval;
			}
			
			//Mock live reading from all currently live triggered
			for (String unit : mockedLiveUnits) {
				int speed = (int) (Math.random()*(100-1)+1);
				int direction = (int) (Math.random()*(360-0)+0);
				String out = unit+"|"+speed+","+direction;

				try {
					MQTTUtil.sendMessage(poster, SubscribeTopic.LiveReadings.toString(), qos, out);
				} catch (Exception e1) {e1.printStackTrace();}
			}

			try {Thread.sleep(1000);}
			catch (InterruptedException e) {e.printStackTrace();}
		}
	}

	public void shutdownAll() {
		CLI.debug(Loc.MOCK, "Shutting down all mock clients...");
		try {
			if (poster.isConnected()) MQTTUtil.disconnect(poster);
			for (Map.Entry<PostTopic, MqttClient> e : subscribers.entrySet()) {
				if (e.getValue().isConnected()) MQTTUtil.disconnect(e.getValue());
			}
		} catch(Exception e) {
			CLI.error(Loc.MOCK, "Exception: "+e);
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
		CLI.error(Loc.MOCK, "Connection Lost: " + cause.toString());
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
			String unit = message.split("\\|")[0];
			if (unit==null) break;
			int trigger = Integer.parseInt(message.split("\\|")[1]);
			if (trigger==1) mock.mockedLiveUnits.add(unit);
			if (trigger==0) mock.mockedLiveUnits.remove(unit);
			break;
		case StatusRequest: //Respond with status update
			//Split unit from log data
			unit = message;
			if (unit==null) break;
			
			String ip = "10.10.10.10";
			long time = System.currentTimeMillis();
			int battery = (int) (Math.random()*(100-1)+1);
			int lat = (int) (Math.random()*(100-1)+1);
			int lon = (int) (Math.random()*(100-1)+1);
			int locAcc = 1;
			String out = unit+"|"+ip+","+time+","+battery+","+lat+","+lon+","+locAcc;
			try {
				MQTTUtil.sendMessage(mock.poster, SubscribeTopic.StatusUpdate.toString(), mock.qos, out);
			} catch (Exception e1) {e1.printStackTrace();}
			
			break;
		default:
			break;
		}
	}

	public void deliveryComplete(IMqttDeliveryToken token) {
		System.out.println("deliveryComplete---------" + token.isComplete());
	}
}
