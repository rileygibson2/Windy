package main.java;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletHandler;

public class CoreServer {
	public static AccountManager accountManager;
	public static UnitManager unitManager;
	
	public static void main(String[] args) throws Exception {
		Server server = new Server(80);
		String webappPath = System.getProperty("user.dir")+"/src/main/webapp";
		System.out.println(webappPath);
		accountManager = new AccountManager();
		unitManager = new UnitManager();

		ResourceHandler resourceHandler = new ResourceHandler();
		resourceHandler.setResourceBase(webappPath);
		//resourceHandler.setDirAllowed(true);
		//resourceHandler.setPathInfoOnly(false);
		ServletHandler dataHandler = new ServletHandler();
		server.setHandler(dataHandler);
		dataHandler.addServletWithMapping(WebServlet.class, "/data/*");
       
        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[] { resourceHandler, dataHandler});
        server.setHandler(handlers);

        DataMockup.makeAccount("mywindy", "admin", "null");
        DataMockup.makeAccount("child", "user", "mywindy");
        DataMockup.makeRecords(0, "windy32b1", "LAB Stage", "8.8.8.8");
        DataMockup.makeRecords(0, "windy64c2", "Rock Stage", "125.99.3.1");
        DataMockup.makeRecords(0, "windy128d3", "Frank Kitts", "30.140.50.100");
      	//DataMockup.makeAccountRecords();
        
		server.start();
		System.out.println("Server running!");
		server.join();
	}
}
