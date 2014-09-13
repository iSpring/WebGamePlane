package iSpring.Listener; /**
 * Created with IntelliJ IDEA.
 * User: iSpring
 * Date: 13-9-24
 * Time: 下午10:43
 * To change this template use File | Settings | File Templates.
 */

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import iSpring.WebSoceket.WebSocketServer;

public class MyServletContextListener implements ServletContextListener{


    public MyServletContextListener() {
    }

    //服务器启动时调用
    public void contextInitialized(ServletContextEvent sce) {
        WssRunner r1 = new WssRunner();
        Thread t = new Thread(r1);
        t.start();
        System.out.println("执行自定义的Listener");
    }

    //服务器关闭时调用
    public void contextDestroyed(ServletContextEvent sce) {
        System.out.println("停止执行自定义的Listener");
    }
}

class WssRunner implements Runnable{
    public WebSocketServer wss = null;
    public void run(){
        wss = new WebSocketServer(8888);
        wss.listen();
    }
}
