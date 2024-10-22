
set -e


export DEBIAN_FRONTEND=noninteractive


sudo apt-get update


sudo apt-get install -y unzip curl


curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs


node --version
