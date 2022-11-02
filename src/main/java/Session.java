package main.java;

import java.security.SecureRandom;
import java.util.Date;

/**
 * Defines a session that has been generated for a client and has a life
 * span.
 * 
 * @author thesmileyone
 *
 */
public class Session {
	
	final private String key;
	final private String user;
	final private long expiry;
	
	//MQTT live control
	private boolean liveReadingState;
	private String liveUnit; //Unit that was last recieving live data
	
	public Session(String user, long life) {
		this.user = user;
		String temp = "";
		SecureRandom r = new SecureRandom();
		for (int i=0; i<10; i++) temp += r.nextInt(50);
		key = temp;
		expiry = new Date().getTime()+life;
		this.liveReadingState = false;
		this.liveUnit = null;
	}
	
	public String getKey() {return this.key;}
	
	public String getUser() {return this.user;}
	
	public long getExpiry() {return this.expiry;}
	
	public boolean isLiveReading() {return this.liveReadingState;}
	
	public String getLiveUnit() {return this.liveUnit;}
	
	public void setLiveReading(String unit) {
		if (unit==null) return;
		this.liveReadingState = true;
		this.liveUnit = unit;
	}
	
	public void clearLiveReading() {
		this.liveReadingState = false;
		this.liveUnit = null;
	}
	
	public boolean isExpired() {
		if (new Date().getTime()>=expiry) return true;
		return false;
	}
}
