import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/donor_signup.dart';
import 'screens/emergency_feed.dart';
import 'screens/request_form.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HemoGo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.red),
        useMaterial3: true,
      ),
      // 1. Define the opening screen
      home: const HomeScreen(),

      // 2. The routes map connecting string paths to screen widgets
      routes: {
        '/donor_signup': (context) => const DonorSignupScreen(),
        '/request': (context) => const RequestFormScreen(),
        '/feed': (context) => const EmergencyFeedScreen(),
      },
    );
  }
}