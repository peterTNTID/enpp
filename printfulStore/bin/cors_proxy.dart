import 'dart:io';
import 'package:http/http.dart' as http;

Future<void> main() async {
  final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 8080);
  print('Proxy listening on http://localhost:${server.port}');

  await for (HttpRequest request in server) {
    if (request.method == 'OPTIONS') {
      _addCorsHeaders(request.response);
      request.response.close();
      continue;
    }

    // IMAGE PROXY
    if (request.uri.path == '/image_proxy') {
      final imageUrl = request.uri.queryParameters['url'];
      if (imageUrl == null) {
        request.response.statusCode = 400;
        request.response.write('Missing url parameter');
        await request.response.close();
        continue;
      }

      final client = http.Client();
      try {
        final imageResponse = await client.get(Uri.parse(imageUrl));
        request.response.statusCode = imageResponse.statusCode;
        request.response.headers.contentType = imageResponse.headers['content-type'] != null 
            ? ContentType.parse(imageResponse.headers['content-type']!) 
            : ContentType.binary;
            
        _addCorsHeaders(request.response);
        request.response.add(imageResponse.bodyBytes);
      } catch (e) {
        print('Image Proxy Error: $e');
        request.response.statusCode = 500;
      } finally {
        await request.response.close();
        client.close();
      }
      continue;
    }

    // API PROXY
    final client = http.Client();
    try {
      // Forward to Printful
      // request.uri include the path and query parameters
      final url = Uri.parse('https://api.printful.com${request.uri}'); // Logic might need adjustment if using same proxy port for both
      // If the path is /store/products, it works.
      // But if user hits /image_proxy, we handled it above.
      
      print('Proxying to: $url');

      final apiResponse = await client.get(
        url,
        headers: {
           // Forward Authorization header
           if (request.headers.value('Authorization') != null)
            'Authorization': request.headers.value('Authorization')!,
        },
      );

      request.response.statusCode = apiResponse.statusCode;
      _addCorsHeaders(request.response);
      request.response.write(apiResponse.body);
    } catch (e) {
      print('Proxy Error: $e');
      request.response.statusCode = 500;
      request.response.write('Proxy Error: $e');
    } finally {
      await request.response.close();
      client.close();
    }
  }
}

void _addCorsHeaders(HttpResponse response) {
  response.headers.add('Access-Control-Allow-Origin', '*');
  response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.add('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}
