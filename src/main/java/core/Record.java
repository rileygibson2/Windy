package main.java.core;

public class Record {
	public Long ts; //Timestamp
	public Integer ws; //Windspeed
	public Double dir; //Direction
	public Long tsGust; //Peak gust timestamp
	public Long wsGust; //Peak gust windspeed
	public Double wsMin; //Min windspeed
	public Double wsAvg; //Average windspeed
	
	String split = "_"; //Character to split with while string formatting
	
	public Record(Long ts, Integer ws) {
		this.ts = ts;
		this.ws = ws;
	}
	
	@Override
	public String toString() {
		String str = "[";
		str += ts;
		str += split+ws;
		if (dir!=null) str += split+dir;
		if (tsGust!=null) str += split+tsGust;
		if (wsGust!=null) str += split+wsGust;
		if (wsMin!=null) str += split+wsMin;
		if (wsAvg!=null) str += split+wsAvg;
		str += "]";
		return str;
	}
}
