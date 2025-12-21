# 클라이언트 기반 GeoMx DSP 공간 전사체 데이터 분석 플랫폼

## 배경 및 선행 연구

- GeoMx DSP는 조직 내에서 특정 영역의 유전자와 단백질 발현을 공간적으로 분석하는 NanoString사의 디지털 공간 프로파일러 시스템으로 관심 영역을 지정한 뒤 해당 영역의 RNA 및 단백질 발현량을 고해상도로 정량 분석하여 공간적 맥락을 파악할 수 있음 [1].
- 그러나 GeoMx DSP 데이터를 분석하기 위해서는 서버 기반 환경에 데이터를 업로드하는 경우가 많아 데이터 유출 위험이 존재하고 R 패키지 설치 등 코드를 직접 수정해야 해 임상 사용자가 활용하기 어렵다는 한계가 있음.
- 따라서 보안성과 접근성을 확보할 수 있는 클라이언트 기반의 실시간 분석 환경 구축이 필요함.
- Davis Laboratory에서 개발한 GeoMxAnalysisWorkflow는 standR [3] 패키지를 활용하여 GeoMx DSP 데이터의 표준화된 분석 절차를 제공하지만 모든 패키지를 로컬 환경에 설치 후 실행해야 한다는 제약이 존재함.
- ROSALIND 플랫폼 [4]과 같은 클라우드 기반 분석 서비스는 GeoMx DSP 데이터를 업로드하여 품질 관리와 차등 발현 유전자 선정을 자동으로 수행할 수 있는 상용 솔루션을 제공하지만 전송 속도와 보안성 측면의 한계를 지님.

---

## 제안한 방법

### 플랫폼 구조

- 본 연구에서는 WebAssembly [2] 기반 실행 환경인 WebR과 Pyodide를 활용하여 브라우저에서 GeoMx DSP 데이터를 실시간으로 분석할 수 있는 클라이언트 기반의 분석 플랫폼을 제안함.
- React와 WebR은 메인 스레드에서 동작하여 각각 사용자 인터페이스를 렌더링하고 R을 실행함. Web Worker는 백그라운드에서 Pyodide를 실행하여 R과 Python을 병렬로 처리할 수 있는 구조임.

<img src="https://github.com/user-attachments/assets/ed4b92d0-d05e-47ce-af07-0409668a543c" width="600">

### 데이터 분석 과정

- ROI Quality Control은 관심 영역인 ROI가 신뢰할 수 있는 발현 데이터를 가지고 있는지를 검증함.
- Gene Quality Control은 저발현 또는 비특이적 발현을 보이는 유전자를 제거함.
- 정규화는 ROI의 총 발현값을 기준으로 스케일을 보정한 후 로그 변환을 적용하여 logCPM 값을 계산함.
- 차원 축소는 주성분 분석 [5]을 활용하여 정규화된 유전자 발현 데이터를 저차원 공간으로 변환하여 그룹 간 패턴과 유사성을 시각적으로 탐색함.
- 차등 발현 유전자 선정은 발현이 유의하게 증가하거나 감소한 유전자를 탐색함. 정규화된 데이터를 사용해 |log₂ Fold Change| > 1과 FDR < 0.05 조건을 동시에 만족하는 유전자를 통계적으로 유의한 차등 발현 유전자로 선정함.
- Pathway 기반 분석은 차등 발현 유전자에 대해 WikiPathways 데이터베이스를 이용하여 ORA(Over-representation Analysis)를 수행함.
- 머신러닝 분류 분석은 Random Forest [6] 모델을 사용하여 각 ROI의 그룹을 예측함. 발현 차이가 유의한 차등 발현 유전자만을 입력 특징으로 활용하고 이를 Train Data 70%와 Test Data 30%로 분할하여 학습함.

<img src="https://github.com/user-attachments/assets/08841a8a-d7c6-452d-a311-9e5e5fe0de9f" width="700">

### 실행 화면

<img src="https://github.com/user-attachments/assets/c1bb2257-7efb-46ca-831a-096b56d529b9" width="700">

---

## 결과

### 선행 연구 데이터 재분석

- 본 연구에서는 기존에 분석이 수행된 GeoMx DSP 데이터를 제안한 플랫폼에 적용하여 선행 연구 결과 [7]와의 일관성을 검증하였음.
- 해당 선행 연구 [7]에서는 조기 대장암 발생 및 진행 단계에서 PanCK+ 상피 영역과 Vimentin+ 기질 영역 그리고 Normal에서 Dysplasia 및 Carcinoma로 이어지는 대장암 진행 단계를 포함하여 유전자 발현 및 면역 세포 구성 변화를 공간적 맥락에서 살펴봄으로써 진단 마커 및 치료 타깃 발굴 가능성을 제시하였음.

### 차원 축소 및 차등 발현 유전자 선정 결과

- 차원 축소 결과의 경우 저차원 공간에서의 분포 형태 및 군집 양상이 선행 연구 결과 [7]와 동일하게 재현됨.
- 차등 발현 유전자 분석에서도 높은 수준의 일관성이 확인됨. 선행 연구 결과 [7]에서 보고된 상위 20개의 차등 발현 유전자 중 17개가 동일하게 선정되었으며 Volcano Plot에서의 분포 패턴 역시 매우 유사하게 나타남.

<img src="https://github.com/user-attachments/assets/7616e459-1df6-4138-8ce7-2a0bfb67e421" width="600">

### ORA 기반 Pathway Enrichment 분석 결과

- ORA 기반 Pathway Enrichment 분석 결과의 경우 선행 연구 결과 [7]에서 보고된 분석 결과와 주요 생물학적 경향 측면에서 높은 일관성을 보였음.
- PanCK+ 영역에서는 Alpha 6 Beta 4 Integrin Signaling 및 Focal Adhesion이 두드러졌으며 Vimentin+ 영역에서도 Focal Adhesion이 유의하게 강화되어 있었음. 선행 연구 결과 [7]에서도 상피 영역과 기질 영역 모두에서 Integrin 신호의 활성화와 ECM–세포 결합의 증대가 확인된 바 있어 암 진행 과정에서 상피 영역과 기질 영역 간 상호작용이 병리 형성에 핵심적으로 기여함을 재확인하는 결과라고 할 수 있음.
- PanCK+ 영역에서는 Wnt 및 ErbB 신호 경로가 강화되어 있었으며 이는 선행 연구 결과 [7]에서 보고된 상피 영역 특이적 성장 인자 기반 발현 패턴과 부합했음. 반면 Vimentin+ 영역은 케모카인 신호 경로와 대식세포 관련 면역 반응이 두드러지게 나타났으며 이는 기질 면역활성 및 섬유아세포 활성화가 병존하는 선행 연구 결과 [7]의 서술 내용과 일치함.

<img src="https://github.com/user-attachments/assets/1b17aa4d-2adb-4fb8-ac52-61b56555d93b" width="600">

---

## 결론 및 향후 연구

- 본 연구에서는 별도의 서버 환경 없이 브라우저 상에서 GeoMx DSP 데이터를 실시간으로 분석할 수 있는 클라이언트 기반의 공간 전사체 데이터 분석 플랫폼을 제안하였음.
- 결과적으로 공간 전사체 데이터 분석을 위한 보안성, 접근성, 데이터 전송 효율성을 모두 갖춘 새로운 형태의 분석 가능성을 제시하였음.
- 향후에는 성능 최적화 및 Interactive Plot 기능으로 사용자와 상호작용할 수 있도록 확장할 예정임.

---

## 참고문헌

[1] Hernandez, Sharia, et al., “Challenges and opportunities for immunoprofiling using a spatial high-plex technology: the NanoString GeoMx® digital spatial profiler”, Frontiers in oncology, 12, 2022.
<br>
[2] Haas, Andreas, et al., “Bringing the web up to speed with WebAssembly”, Proceedings of the 38th ACM SIGPLAN conference on programming language design and implementation, 185-200, 2017.
<br>
[3] Liu, Ning, et al., “standR: spatial transcriptomic analysis for GeoMx DSP data”, Nucleic Acids Research, 52, 1, 2024.
<br>
[4] ROSALIND Platform, “ROSALIND: Discovery Platform & Data Hub for Scientists”, Web resource, 2024.
<br>
[5] Abdi, Hervé, and Lynne J. Williams, “Principal component analysis”, Wiley interdisciplinary reviews: computational statistics, 2, 4, 433-459, 2010.
<br>
[6] Breiman, Leo, “Random forests”, Machine learning, 45, 1, 5-32, 2001.
<br>
[7] Roelands, Jessica, et al., “Transcriptomic and immunophenotypic profiling reveals molecular and immunological hallmarks of colorectal cancer tumourigenesis”, Gut, 72, 7, 1326-1339, 2023.
<br>

⋇ 본 연구는 보건복지부의 재원으로 한국보건산업진흥원의 보건의료기술 연구개발사업 지원에 의하여 이루어진 것임(RS-2024-00403375).
<br>
⋇ 이 성과는 과학기술정보통신부의 재원으로 한국연구재단의 지원을 받아 수행된 연구임(RS-2025-24534272).
