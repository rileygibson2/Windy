package main.java;

import java.security.SecureRandom;
import java.util.Date;

public class SessionKey {
	
	final private String key;
	final private long expiry;
	
	public SessionKey(long life) {
		String temp = "";
		SecureRandom r = new SecureRandom();
		for (int i=0; i<10; i++) temp += r.nextInt(50);
		key = temp;
		expiry = new Date().getTime()+life;
	}
	
	public String getKey() {return this.key;}
	
	public long getExpiry() {return this.expiry;}
	
	public boolean isExpired() {
		if (new Date().getTime()>=expiry) return true;
		return false;
	}
}
