import 'package:flutter/material.dart';
import '../models/donor.dart'; // Import your Donor data model

class DonorSignupScreen extends StatefulWidget {
  const DonorSignupScreen({super.key});

  @override
  State<DonorSignupScreen> createState() => _DonorSignupScreenState();
}

class _DonorSignupScreenState extends State<DonorSignupScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers to capture user input
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _locationController = TextEditingController();
  final _pincodeController = TextEditingController();

  // Track the selected blood type from dropdown
  String? _selectedBloodType;

  // Available blood types for the dropdown selection
  final List<String> _bloodTypes = [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Bombay Blood Group (hh)'
  ];

  @override
  void dispose() {
    // Clean up controllers when the widget is destroyed
    _nameController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {

      // 1. Instantiate a new Donor object from your model using the text controller inputs
      Donor newDonor = Donor(
        name: _nameController.text.trim(),
        bloodType: _selectedBloodType ?? 'Unknown',
        phone: _phoneController.text.trim(),
        location: _locationController.text.trim(),
      );

      // 2. Print the entire unified object via its toString() method
      print('--- Created New Donor Object ---');
      print(newDonor.toString());

      // Show the explicit custom success popup dialog box
      showDialog(
        context: context,
        barrierDismissible: false, // User must press OK to close it
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Center(
              child: Text(
                'Registered Successfully ✅',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            content: const Text(
              'Thank you for registering as a blood donor!',
              textAlign: TextAlign.center,
            ),
            actions: [
              TextButton(
                onPressed: () {
                  // Close the dialog window
                  Navigator.pop(context);
                  // Go back to the Home Screen
                  Navigator.pop(this.context);
                },
                child: const Center(child: Text('OK')),
              ),
            ],
          );
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Donor Signup'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedBloodType,
                hint: const Text('Select Blood Type'),
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'Blood Type',
                ),
                items: _bloodTypes.map((String type) {
                  return DropdownMenuItem<String>(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedBloodType = newValue;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a blood type';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Location / City',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your location';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _pincodeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Pincode',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your pincode';
                  }
                  if (value.trim().length < 6) {
                    return 'Please enter a valid 6-digit pincode';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _submitForm,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Submit Registration'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}