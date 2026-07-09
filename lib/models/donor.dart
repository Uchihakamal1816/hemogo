class Donor {
  final String name;
  final String bloodType;
  final String phone;
  final String location;

  // Constructor taking all four fields
  Donor({
    required this.name,
    required this.bloodType,
    required this.phone,
    required this.location,
  });

  // Method to return a readable string of donor info
  @override
  String toString() {
    return 'Donor(Name: $name, Blood Type: $bloodType, Phone: $phone, Location: $location)';
  }
}