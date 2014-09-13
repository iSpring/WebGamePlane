package iSpring.WebSoceket;

/*
         * 输入串:
         *      GET / HTTP/1.1\r\n
                Upgrade: websocket\r\n
                Connection: Upgrade\r\n
                Host: 192.168.1.36:8050\r\n
                Sec-WebSocket-Origin: http://localhost:5113\r\n
                Sec-WebSocket-Key: YZgRBqBF5a5uWll/N8/R+Q==\r\n
                Sec-WebSocket-Version: 8\r\n\r\n
         *
         *  GetValue("Upgrade"),返回"websocket"
         *
         *  Response:
         *      HTTP/1.1 101 Web Socket Protocol Handshake\r\n
    　　　　　　Upgrade: websocket\r\n
    　　　　　　Connection: Upgrade\r\n
   　　 　　　　Sec-WebSocket-Accept: EailQ5Var3+aJmxVsqnNoxUc3sU=\r\n
    　　　　　　WebSocket-Origin: http://localhost:5113\r\n
   　　 　　　　WebSocket-Location: ws://192.168.1.36:8050\r\n\r\n
         */

import java.util.HashMap;

public class Handshake {
    final String magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    HashMap<String,String> requestMap = new HashMap<String, String>();

    public Handshake(String request){
        //分割字符串，用于分割每一行
        String separator1 = "\r\n";
        String[] rows = request.split(separator1);
        for(String row : rows){
            int splitIndex = row.indexOf(":");
            if(splitIndex > 0){
                String key1 = row.substring(0,splitIndex).trim();
                //因为有时返回的是Sec-WebSocket-Origin，有时返回的是Origin，所以做这样的处理
                if (key1.toLowerCase().indexOf("origin") > 0){
                    key1 = "Origin";
                }
                String value1 = row.substring(splitIndex + 1).trim();
                requestMap.put(key1, value1);
            }
        }
    }

    private String getWebSocketAccept(){
        String webSocketKey = this.getValue("Sec-WebSocket-Key");
        String accept = EncoderHandler.encodeBySHA1(webSocketKey+this.magic);
        return accept;
    }

    private String getValue(String key){
        String value = "";
        if(this.requestMap.containsKey(key)){
            value = this.requestMap.get(key);
        }
        return value;
    }

    /**
     * 通过判断头信息判断是否是WebSocket链接
     * @return
     */
    public boolean isWebSocket(){
        //不要用==判断
        boolean b = this.getValue("Upgrade").toLowerCase().equals("websocket");
        return b;
    }

    public String getResponse(){
        StringBuilder response = new StringBuilder(); //响应串
        response.append("HTTP/1.1 101 Web Socket Protocol Handshake\r\n");

        //将请求串的键值转换为对应的响应串的键值并添加到响应串
        response.append("Upgrade: "+this.getValue("Upgrade")+"\r\n");
        response.append("Connection: "+this.getValue("Connection")+"\r\n");
        response.append("Sec-WebSocket-Accept: "+this.getWebSocketAccept()+"\r\n");
        response.append("WebSocket-Origin: "+this.getValue("Origin")+"\r\n");
        response.append("WebSocket-Location: "+this.getValue("Host")+"\r\n");
        response.append("\r\n");

        return response.toString();
    }
}