package main.java.core;

public class Record {
	public Long ts; //Timestamp
	public Double ws; //Windspeed
	public Double dir; //Direction
	public Long tsGust; //Peak gust timestamp
	public Long wsGust; //Peak gust windspeed
	public Double wsMin; //Min windspeed
	public Double wsAvg; //Average windspeed
	public Integer al; //Alert level
	
	String split; //Character to split with while string formatting
	
	public Record(String split) {
		this.split = split;
	}
	
	public Record(Long ts, String split) {
		this.ts = ts;
		this.split = split;
	}
	
	public Record(Long ts, Double ws, String split) {
		this.ts = ts;
		this.ws = ws;
		this.split = split;
		updateAlertLevel();
	}
	
	public void setTS(long ts) {
		this.ts = ts;
	}
	
	public void setWS(double ws) {
		this.ws = ws;
		updateAlertLevel();
	}
	
	public void setDir(double dir) {
		this.dir = dir;
	}
	
	private void updateAlertLevel() {
		if (ws==null) return;
		if (ws>=DataManager.redAlarm) al = 3;
		else if (ws>=DataManager.amberAlarm) al = 2;
		else al = 1;
	}
	
	@Override
	public String toString() {
		String str = "[";
		str += ts;
		if (ws!=null) str += split+ws;
		if (dir!=null) str += split+dir;
		if (tsGust!=null) str += split+tsGust;
		if (wsGust!=null) str += split+wsGust;
		if (wsMin!=null) str += split+wsMin;
		if (wsAvg!=null) str += split+wsAvg;
		if (al!=null) str += split+al;
		str += "]";
		return str;
	}
}
