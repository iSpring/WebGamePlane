package iSpring.WebSoceket;

import com.sun.org.apache.xml.internal.security.utils.Base64;

import java.security.MessageDigest;

public class EncoderHandler {
    //MD5、SHA1
    private static String encode(String algorithm, String str) {
        if (str == null) {
            return null;
        }
        try {
            MessageDigest messageDigest = MessageDigest.getInstance(algorithm);
            messageDigest.update(str.getBytes());
            return getFormattedText(messageDigest.digest());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String encodeBySHA1(String str){
        String result = EncoderHandler.encode("SHA1",str);
        return result;
    }

    private static String getFormattedText(byte[] bytes) {
        String result = Base64.encode(bytes);
        return result;
    }

    public static void main(String[] args) {
        String b = "U00QUfV1CRfIIU0NkcUCnA==258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
        System.out.println(b +" SHA1 :"+ EncoderHandler.encodeBySHA1(b));
    }
}
