import paramiko
import time
import os
from datetime import datetime

# --- 설정 구간 ---
SERVERS = {
    "172.26.237.204": 2,
    "172.26.237.205": 2,
    "172.26.237.206": 4
}
SSH_USER = "hiskim1"
# SSH 키 경로 (Windows는 'C:/Users/name/.ssh/id_rsa', Mac은 '/Users/name/.ssh/id_rsa')
SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_rsa") 
LOG_FILE = "gpu_usage_history.log"

def log_message(msg):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    formatted_msg = f"[{timestamp}] {msg}"
    print(formatted_msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted_msg + "\n")

def get_gpu_status(ssh_client):
    util_cmd = "nvidia-smi --query-gpu=index,utilization.gpu --format=csv,noheader,nounits"
    proc_cmd = "nvidia-smi --query-compute-apps=gpu_index,pid --format=csv,noheader,nounits"
    
    _, stdout, _ = ssh_client.exec_command(util_cmd)
    utils = stdout.read().decode().strip().split('\n')
    
    _, stdout, _ = ssh_client.exec_command(proc_cmd)
    procs_raw = stdout.read().decode().strip().split('\n')
    
    gpu_procs = {}
    for line in procs_raw:
        if not line or ',' not in line: continue
        g_idx, pid = line.split(', ')
        gpu_procs.setdefault(g_idx, []).append(pid)
        
    results = []
    for line in utils:
        if not line or ',' not in line: continue
        idx, util = line.split(', ')
        util = int(util)
        
        users = set()
        if util > 0 and idx in gpu_procs:
            for pid in gpu_procs[idx]:
                user_cmd = f"ps -o user= -p {pid}"
                _, u_out, _ = ssh_client.exec_command(user_cmd)
                username = u_out.read().decode().strip()
                if username: users.add(username)
        
        results.append({"idx": idx, "util": util, "users": list(users) if users else ["None"]})
    return results

def run_monitor():
    log_message("GPU Monitoring Automation Started.")
    
    while True:
        for ip in SERVERS.keys():
            try:
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                
                # 비밀번호 대신 SSH Key 사용
                ssh.connect(ip, username=SSH_USER, key_filename=SSH_KEY_PATH, timeout=10)
                
                status = get_gpu_status(ssh)
                for s in status:
                    if s['util'] > 0:
                        log_message(f"[{ip}] GPU {s['idx']}: {s['util']}% | User: {', '.join(s['users'])}")
                
                ssh.close()
            except Exception as e:
                log_message(f"[ERROR] {ip} Connection Failed: {e}")
        
        time.sleep(60)

if __name__ == "__main__":
    run_monitor()